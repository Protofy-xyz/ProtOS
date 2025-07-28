import { getApp, getMQTTClient, getServiceToken } from 'protonode'
import { getLogger, getConfig, generateEvent } from 'protobase';
import { getConfigWithoutSecrets } from '@my/config'
import BundleContext from 'app/bundles/context'
import { pathToFileURL } from 'url';
import fs from 'fs'
const { createExpressProxy } = require('app/proxy.js')

const logger = getLogger()
const subscriptions = {}
const isProduction = process.env.NODE_ENV === 'production';
const serviceName = isProduction ? 'api' : 'api-dev'

const app = getApp((app) => app.use( createExpressProxy('api') ))

//wait for mqtt before starting api server
const mqtt = getMQTTClient(serviceName, getServiceToken(), async () => {
    logger.debug({ config: getConfigWithoutSecrets(getConfig()) }, "Service Started: api")

    const topicSub = (mqtt, topic, cb) => { //all = continuous, single = just one, change = first change
        mqtt.subscribe(topic)
        const subscriptionId = Math.random().toString(36).substring(2)
        if (!subscriptions[topic]) {
            subscriptions[topic] = {}
        }
        subscriptions[topic][subscriptionId] = cb
        return () => {
            delete subscriptions[topic][subscriptionId]
            if (Object.keys(subscriptions[topic]).length === 0) {
                mqtt.unsubscribe(topic)
                delete subscriptions[topic]
            }
        }
    };

    const topicPub = (mqtt, topic, data) => {
        mqtt.publish(topic, data)
    }

    try {
        const BundleAPI = await import(pathToFileURL(require.resolve('app/bundles/apis')).href);
        const BundleChatbotsAPI = await import(pathToFileURL(require.resolve('app/bundles/chatbots')).href);
        //wait for mqtt before starting API
        await BundleAPI.default(app, { mqtt, topicPub, topicSub, ...BundleContext })
        BundleChatbotsAPI.default(app, { mqtt, topicPub, topicSub, ...BundleContext })
    } catch (error) {
        generateEvent({
            path: 'services/' + serviceName + '/crash', //event type: / separated event category: files/create/file, files/create/dir, devices/device/online
            from: serviceName, // system entity where the event was generated (next, api, cmd...)
            user: 'system', // the original user that generates the action, 'system' if the event originated in the system itself
            payload: { error: error.toString() }, // event payload, event-specific data
        }, getServiceToken())
        logger.error({ error: error.toString() }, "Server error")
    }

    //import dynamic api modules/automations, loop 
    fs.readdirSync('../../data/automations').filter(file => file.endsWith('.ts')).forEach(file => { // ../../ here because readdir is relative to cwd
        import(pathToFileURL(require.resolve('../../../data/automations/' + file)).href).then((module) => { // ../../../ here because requiere is relative to module file, now cwd
            module.default(app, { mqtt, topicPub, topicSub, ...BundleContext })
        }).catch((error) => {
            logger.error({ error: error.toString() }, "Error loading automation: " + file)
        });
    })

    generateEvent({
        path: 'services/api/ready', //do not use serviceName here, since core depends on this event to autostart boards
        from: 'api', 
        user: 'system', 
        payload: { state: 'ready' }
    }, getServiceToken())
})

mqtt.on("message", (messageTopic, message) => {
    const topic = messageTopic.toString()
    let parsedMessage = message.toString()
    try {
        parsedMessage = JSON.parse(parsedMessage);
    } catch (err) { }

    // Handle wildcard subscriptions
    const validSubscriptions = Object.keys(subscriptions).filter(subscription => {
        const subscriptionParts = subscription.split('/');
        const topicParts = topic.split('/');

        for (let i = 0; i < subscriptionParts.length; i++) {
            if (subscriptionParts[i] === '#') {
                return true;
            }

            if (subscriptionParts[i] !== '+' && subscriptionParts[i] !== topicParts[i]) {
                return false;
            }
        }
        return true;
    });

    validSubscriptions.forEach(subscription => {
        Object.keys(subscriptions[subscription]).forEach(subscriptionId => {
            subscriptions[subscription][subscriptionId](parsedMessage, topic);
        });
    });
});

export default app

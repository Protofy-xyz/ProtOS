import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { settingsAtom } from '../hooks';
import { useSubscription } from 'protolib/lib/mqtt';
import { setTintByName } from 'protolib/lib/Tints';

export const SettingsConnector = ({ children }) => {
    const setSettings = useSetAtom(settingsAtom);
    const { onMessage } = useSubscription('notifications/setting/#');

    useEffect(() => {
        if (typeof window !== 'undefined' && window.ventoSettings) {
            setSettings(window.ventoSettings);
            if(window.ventoSettings['theme.accent']) {
                setTintByName(window.ventoSettings['theme.accent']);
            }
        }

        // suscripción MQTT
        onMessage?.((msg) => {
            try {
                const parts = msg.topic.split('/');
                const action = parts[2]
                const parsed = JSON.parse(msg.message);
                if (parsed?.name) {
                    if(parsed?.name === 'theme.accent') {
                        setTintByName(parsed.value);
                    }
                    if(action == 'delete') {
                        setSettings(prev => {
                            const newSettings = { ...prev };
                            delete newSettings[parsed.name];
                            return newSettings;
                        });
                        return;
                    }
                    setSettings(prev => ({ ...prev, [parsed.name]: parsed.value }));
                }
            } catch { }
        });
    }, [onMessage, setSettings]);

    return children;
};
import { AutoActions, AutoAPI, getAuth, getServiceToken } from 'protonode'
import APIContext from "app/bundles/context";
import { API, Protofy, getLogger } from "protobase";
import { Application } from 'express';
import fs from 'fs'
import path from "path";
import { StatesModel } from '../objects/states'

const root = path.join(process.cwd(), '..', '..')
const logger = getLogger()

Protofy("type", "AutoAPI")
Protofy("object", "states")
const {name, prefix} = StatesModel.getApiOptions()

const statesAPI = AutoAPI({ 
    modelName: name,
    modelType: StatesModel,
    initialData: {},
    prefix: prefix
})

const statesActions = AutoActions({
    modelName: name,
    modelType: StatesModel,
    prefix: prefix,
    object: 'states'
})

export default Protofy("code", async (app:Application, context: typeof APIContext) => {
    statesAPI(app, context)
    statesActions(app, context)
    //you can add more apis here, like:
    /*
    app.get('/api/v1/test/states', (req, res) => {
        //you code goes here
        //reply with res.send(...)
    })
    */      
})
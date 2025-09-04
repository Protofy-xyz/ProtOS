import { Protofy, Schema, BaseSchema, getLogger, ProtoModel, SessionDataType, z  } from 'protobase'
import moment from "moment";

const logger = getLogger()
Protofy("features", {
    "adminPage": "/objects/view?object=statesModel"
})

export const BaseStatesSchema = Schema.object(Protofy("schema", {
	status: z.string(),
    timestamp: z.string().generate((obj) => moment().toISOString()).search().indexed(),

}))

//check if any of the fields of the schema has set the id flag
const hasId = Object.keys(BaseStatesSchema.shape).some(key => BaseStatesSchema.shape[key]._def.id)

export const StatesSchema = Schema.object({
    ...(!hasId? BaseSchema.shape : {}),
    ...BaseStatesSchema.shape
});

export type StatesType = z.infer<typeof StatesSchema>;

export class StatesModel extends ProtoModel<StatesModel> {
    constructor(data: StatesType, session?: SessionDataType, ) {
        super(data, StatesSchema, session, "States");
    }

    public static getApiOptions() {
        return Protofy("api", {
            "name": "states",
            "prefix": "/api/v1/"
        })
    }

    create(data?):StatesModel {
        const result = super.create(data)
        return result
    }

    read(extraData?): StatesType {
        const result = super.read(extraData)
        return result
    }

    update(updatedModel: StatesModel, data?: StatesType): StatesModel {
        const result = super.update(updatedModel, data)
        return result
    }

	list(search?, session?, extraData?, params?, jsCode?): StatesType[] {
        const result = super.list(search, session, extraData, params, jsCode)
        return result
    }

    delete(data?): StatesModel {
        const result = super.delete(data)
        return result
    }

    protected static _newInstance(data: any, session?: SessionDataType): StatesModel {
        return new StatesModel(data, session);
    }

    static load(data: any, session?: SessionDataType): StatesModel {
        return this._newInstance(data, session);
    }
}

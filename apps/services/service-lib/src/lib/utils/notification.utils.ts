import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { NotificationEventParameterMapping } from "../entities";

@Injectable()
export class NotificationUtils {
    private readonly dataSource: DataSource;

    constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    }

    async getNotificationDetailsByEvent(event:string) {
        const repo =await this.dataSource.getRepository(NotificationEventParameterMapping)
        .createQueryBuilder("eventParam")
        .leftJoinAndSelect("eventParam.eventType", "event")
        .leftJoinAndSelect("eventParam.parameterDefinition", "parameterDefinition")
        .where("event.name = :name", { name: event })
        .select("parameterDefinition.key", "parameterKey")
        .getRawMany();
        return repo;

    }   
}
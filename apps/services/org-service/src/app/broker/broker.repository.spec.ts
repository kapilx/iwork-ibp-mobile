import {
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { QueryRunner, Repository } from "typeorm";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { BrokerAddress } from "../../../../service-lib/src/lib/entities/broker-address.entity";
import { BrokerContact } from "../../../../service-lib/src/lib/entities/broker-contact.entity";
import { Broker } from "../../../../service-lib/src/lib/entities/broker.entity";
import { BrokerRepository } from "./broker.repository";
import { BrokerAddressDto } from "./dto/broker-address.dto";
import { BrokerContactDto } from "./dto/broker-contact.dto";
import { CreateBrokerDto } from "./dto/create-broker.dto";

describe("BrokerRepository", () => {
  let brokerRepository: BrokerRepository;
  let brokerRepoMock: Repository<Broker>;
  let brokerAddressRepoMock: Repository<BrokerAddress>;
  let brokerContactRepoMock: Repository<BrokerContact>;
  let entityServiceMock: EntityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrokerRepository,
        {
          provide: getRepositoryToken(Broker),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(BrokerAddress),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(BrokerContact),
          useClass: Repository,
        },
        {
          provide: EntityService,
          useValue: {
            getData: jest.fn(),
            fetchEntityList: jest.fn(),
            getListOfValues: jest.fn(),
          },
        },
      ],
    }).compile();

    brokerRepository = module.get<BrokerRepository>(BrokerRepository);
    brokerRepoMock = module.get<Repository<Broker>>(getRepositoryToken(Broker));
    brokerAddressRepoMock = module.get<Repository<BrokerAddress>>(
      getRepositoryToken(BrokerAddress)
    );
    brokerContactRepoMock = module.get<Repository<BrokerContact>>(
      getRepositoryToken(BrokerContact)
    );
    entityServiceMock = module.get<EntityService>(EntityService);
  });

  describe("addBroker", () => {
    it("should add a broker successfully", async () => {
      const queryRunner = {
        manager: { create: jest.fn(), save: jest.fn() },
      } as unknown as QueryRunner;
      const createBrokerDto: CreateBrokerDto = {
        brokerName: "Test Broker",
      } as CreateBrokerDto;
      const broker = { id: 1, brokerName: "Test Broker" } as Broker;

      queryRunner.manager.create.mockReturnValue(broker);
      queryRunner.manager.save.mockResolvedValue(broker);

      const result = await brokerRepository.addBroker(
        queryRunner,
        createBrokerDto
      );

      expect(queryRunner.manager.create).toHaveBeenCalledWith(
        Broker,
        createBrokerDto
      );
      expect(queryRunner.manager.save).toHaveBeenCalledWith(broker);
      expect(result).toEqual(broker);
    });

    it("should throw an error if adding broker fails", async () => {
      const queryRunner = {
        manager: { create: jest.fn(), save: jest.fn() },
      } as unknown as QueryRunner;
      const createBrokerDto: CreateBrokerDto = {
        brokerName: "Test Broker",
      } as CreateBrokerDto;

      queryRunner.manager.save.mockRejectedValue(new Error("Database error"));

      await expect(
        brokerRepository.addBroker(queryRunner, createBrokerDto)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("findBrokerByName", () => {
    it("should find a broker by name", async () => {
      const brokerName = "Test Broker";
      const broker = { id: 1, brokerName: "Test Broker" } as Broker;

      jest.spyOn(brokerRepoMock, "findOne").mockResolvedValue(broker);

      const result = await brokerRepository.findBrokerByName(brokerName);

      expect(brokerRepoMock.findOne).toHaveBeenCalledWith({
        where: { brokerName: expect.any(Object) },
      });
      expect(result).toEqual(broker);
    });

    it("should throw an error if finding broker fails", async () => {
      jest
        .spyOn(brokerRepoMock, "findOne")
        .mockRejectedValue(new Error("Database error"));

      await expect(
        brokerRepository.findBrokerByName("Test Broker")
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("fetchBrokerById", () => {
    it("should fetch a broker by ID", async () => {
      const brokerId = 1;
      const broker = {
        id: 1,
        brokerName: "Test Broker",
        displayName: null,
        website: null,
        remarks: null,
        companyTypeLid: null,
        companyType: { id: undefined, lookUpValue: undefined },
        status: { id: undefined, lookUpValue: undefined },
        brokerAddresses: undefined,
      } as Broker;

      jest.spyOn(brokerRepoMock, "findOne").mockResolvedValue(broker);

      const result = await brokerRepository.fetchBrokerById(brokerId);

      expect(brokerRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: brokerId },
        relations: [
          "brokerAddresses",
          "brokerAddresses.address.addressType",
          "status",
          "companyType",
        ],
      });
      expect(result).toEqual(broker);
    });

    it("should throw NotFoundException if broker is not found", async () => {
      jest.spyOn(brokerRepoMock, "findOne").mockResolvedValue(null);

      await expect(brokerRepository.fetchBrokerById(1)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("addBrokerAddress", () => {
    it("should add a broker address successfully", async () => {
      const queryRunner = {
        manager: { save: jest.fn() },
      } as unknown as QueryRunner;
      const brokerAddress = { id: 1 } as BrokerAddress;

      queryRunner.manager.save.mockResolvedValue(brokerAddress);

      await brokerRepository.addBrokerAddress(queryRunner, brokerAddress);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(brokerAddress);
    });
  });

  describe("softDeleteBroker", () => {
    it("should soft delete a broker by ID", async () => {
      const brokerId = 1;

      jest.spyOn(brokerRepoMock, "update").mockResolvedValue({} as never);

      await brokerRepository.softDeleteBroker(brokerId);

      expect(brokerRepoMock.update).toHaveBeenCalledWith(brokerId, {
        deletedAt: expect.any(Date),
      });
    });

    it("should throw an error if soft delete fails", async () => {
      jest
        .spyOn(brokerRepoMock, "update")
        .mockRejectedValue(new Error("Database error"));

      await expect(brokerRepository.softDeleteBroker(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("addBrokerContact", () => {
    it("should add a broker contact successfully", async () => {
      const brokerContact = { id: 1 } as BrokerContactDto;

      jest
        .spyOn(brokerContactRepoMock, "save")
        .mockResolvedValue(brokerContact);

      await brokerRepository.addBrokerContact(brokerContact);

      expect(brokerContactRepoMock.save).toHaveBeenCalledWith(brokerContact);
    });

    it("should throw an error if adding broker contact fails", async () => {
      jest
        .spyOn(brokerContactRepoMock, "save")
        .mockRejectedValue(new Error("Database error"));

      await expect(
        brokerRepository.addBrokerContact({} as BrokerContactDto)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("getBrokerById", () => {
    it("should fetch a broker by ID", async () => {
      const broker = { id: 1, brokerName: "Test Broker" } as Broker;

      jest.spyOn(brokerRepoMock, "findOne").mockResolvedValue(broker);

      const result = await brokerRepository.getBrokerById(1);

      expect(brokerRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["brokerAddresses.address.addressType", "status"],
      });
      expect(result).toEqual(broker);
    });

    it("should throw NotFoundException if broker is not found", async () => {
      jest.spyOn(brokerRepoMock, "findOne").mockResolvedValue(null);

      await expect(brokerRepository.getBrokerById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw an error if fetching broker fails", async () => {
      jest
        .spyOn(brokerRepoMock, "findOne")
        .mockRejectedValue(new Error("Database error"));

      await expect(brokerRepository.getBrokerById(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("addBrokerAddressMap", () => {
    it("should add a broker address mapping successfully", async () => {
      const brokerAddress = { id: 1 } as BrokerAddressDto;

      jest
        .spyOn(brokerAddressRepoMock, "create")
        .mockReturnValue(brokerAddress);
      jest
        .spyOn(brokerAddressRepoMock, "save")
        .mockResolvedValue(brokerAddress);

      await brokerRepository.addBrokerAddressMap(brokerAddress);

      expect(brokerAddressRepoMock.create).toHaveBeenCalledWith(brokerAddress);
      expect(brokerAddressRepoMock.save).toHaveBeenCalledWith(brokerAddress);
    });

    it("should throw an error if saving broker address mapping fails", async () => {
      const brokerAddress = { id: 1 } as BrokerAddressDto;

      jest
        .spyOn(brokerAddressRepoMock, "save")
        .mockRejectedValue(new Error("Database error"));

      await expect(
        brokerRepository.addBrokerAddressMap(brokerAddress)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("findBrokerCompanyAddressMap", () => {
    it("should find a broker company address mapping", async () => {
      const brokerAddress = { id: 1 } as BrokerAddress;

      jest
        .spyOn(brokerAddressRepoMock, "findOne")
        .mockResolvedValue(brokerAddress);

      const result = await brokerRepository.findBrokerCompanyAddressMap(1, 1);

      expect(brokerAddressRepoMock.findOne).toHaveBeenCalledWith({
        where: {
          broker: { id: 1 },
          address: { id: 1 },
        },
      });
      expect(result).toEqual(brokerAddress);
    });

    it("should return null if no mapping is found", async () => {
      jest.spyOn(brokerAddressRepoMock, "findOne").mockResolvedValue(null);

      const result = await brokerRepository.findBrokerCompanyAddressMap(1, 1);

      expect(result).toBeNull();
    });
  });

  describe("delinkBrokerContactMap", () => {
    it("should delink a broker contact mapping successfully", async () => {
      const brokerContact = { id: 1 } as BrokerContactDto;

      jest
        .spyOn(brokerContactRepoMock, "delete")
        .mockResolvedValue({} as never);

      await brokerRepository.delinkBrokerContactMap(brokerContact);

      expect(brokerContactRepoMock.delete).toHaveBeenCalledWith(brokerContact);
    });

    it("should throw an error if delinking broker contact mapping fails", async () => {
      const brokerContact = { id: 1 } as BrokerContactDto;

      jest
        .spyOn(brokerContactRepoMock, "delete")
        .mockRejectedValue(new Error("Database error"));

      await expect(
        brokerRepository.delinkBrokerContactMap(brokerContact)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("fetchBrokerList", () => {
    it("should fetch a paginated list of brokers", async () => {
      const brokers = [{ id: 1, brokerName: "Test Broker" }];
      const count = 1;

      jest
        .spyOn(brokerRepoMock, "findAndCount")
        .mockResolvedValue([brokers, count]);

      const result = await brokerRepository.fetchBrokerList(
        1,
        10,
        "Test",
        "brokerName",
        "ASC",
        1
      );

      expect(brokerRepoMock.findAndCount).toHaveBeenCalled();
      expect(result).toEqual({ data: brokers, total: count });
    });

    it("should throw an error if fetching broker list fails", async () => {
      jest
        .spyOn(brokerRepoMock, "findAndCount")
        .mockRejectedValue(new Error("Database error"));

      await expect(
        brokerRepository.fetchBrokerList(1, 10, "Test", "brokerName", "ASC", 1)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("fetchBrokerDetails", () => {
    it("should throw NotFoundException if broker details are not found", async () => {
      jest.spyOn(entityServiceMock, "getData").mockResolvedValue({
        data: [],
      });

      await expect(
        brokerRepository.fetchBrokerDetails(
          ["id", "brokerName"],
          ["brokerAddresses"],
          { id: 1 }
        )
      ).rejects.toThrow(NotFoundException);
    });
  });
});

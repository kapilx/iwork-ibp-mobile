import { Test, TestingModule } from "@nestjs/testing";
import { AddressRepository } from "./address.repository";
import { Repository, DataSource, QueryRunner } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Address } from "../../../../service-lib/src/lib/entities/address.entity";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";
import { Country } from "../../../../service-lib/src/lib/entities/country.entity";
import { State } from "../../../../service-lib/src/lib/entities/state.entity";
import { City } from "../../../../service-lib/src/lib/entities/city.entity";
import { Region } from "../../../../service-lib/src/lib/entities/region.entity";
import {
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

jest.mock("typeorm", () => {
  const original = jest.requireActual("typeorm");
  return {
    ...original,
    DataSource: jest.fn().mockImplementation(() => ({
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn(),
          findAndCount: jest.fn(),
          findOne: jest.fn(),
          remove: jest.fn(),
          find: jest.fn(),
          createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
          })),
        },
      }),
    })),
  };
});

describe("AddressRepository", () => {
  let repository: AddressRepository;
  let addressRepo: Repository<Address>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressRepository,
        {
          provide: getRepositoryToken(Address),
          useClass: Repository,
        },
        {
          provide: DataSource,
          useValue: new DataSource(),
        },
      ],
    }).compile();

    repository = module.get<AddressRepository>(AddressRepository);
    addressRepo = module.get<Repository<Address>>(getRepositoryToken(Address));
    dataSource = module.get<DataSource>(DataSource);
    queryRunner = dataSource.createQueryRunner();
  });

  it("should create an address", async () => {
    const addressDto: CreateAddressDto = {
      address1: "123 Main",
      area: "Area1",
      pinCode: "123456",
    } as any;
    const savedAddress = { id: 1, ...addressDto };
    jest.spyOn(addressRepo, "create").mockReturnValue(savedAddress as Address);
    queryRunner.manager.save = jest.fn().mockResolvedValue(savedAddress);

    const result = await repository.createAddress(addressDto);
    expect(result).toEqual(savedAddress);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
  });

  it("should fetch all addresses with pagination", async () => {
    const data = [{ id: 1 }] as Address[];
    queryRunner.manager.findAndCount = jest.fn().mockResolvedValue([data, 1]);
    const result = await repository.fetchAllAddressDetails(1, 10);
    expect(result.data).toEqual(data);
    expect(result.count).toBe(1);
  });

  it("should throw if address not found", async () => {
    queryRunner.manager.findOne = jest.fn().mockResolvedValue(null);
    await expect(repository.getAddressDetails(1)).rejects.toThrow(
      NotFoundException
    );
  });

  it("should update an address", async () => {
    const existingAddress = {
      id: 1,
      countryId: {},
      stateId: {},
      cityId: {},
    } as Address;
    const updateDto: UpdateAddressDto = {
      address1: "New",
      countryId: 1,
      stateId: 2,
      cityId: 3,
    } as any;
    queryRunner.manager.findOne = jest
      .fn()
      .mockResolvedValueOnce(existingAddress)
      .mockResolvedValueOnce({ id: 1 }) // country
      .mockResolvedValueOnce({ id: 2 }) // state
      .mockResolvedValueOnce({ id: 3 }); // city
    queryRunner.manager.save = jest
      .fn()
      .mockResolvedValue({ ...existingAddress, ...updateDto });

    const result = await repository.updateAddressDetails(1, updateDto);
    expect(result.address1).toBe("New");
  });

  it("should delete an address", async () => {
    const addressData = { id: 1 } as Address;
    jest.spyOn(repository, "getAddressDetails").mockResolvedValue(addressData);
    queryRunner.manager.remove = jest.fn();

    await repository.removeAddressDetails({ id: 1 });
    expect(queryRunner.manager.remove).toHaveBeenCalledWith(addressData);
  });

  it("should fetch all regions", async () => {
    queryRunner.manager.find = jest.fn().mockResolvedValue([{ id: 1 }]);
    const result = await repository.findAllRegions();
    expect(result.length).toBeGreaterThan(0);
  });

  it("should fetch countries by region id", async () => {
    const query = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
    };
    queryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(query);
    const result = await repository.findCountries(1);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should fetch all countries", async () => {
    queryRunner.manager.find = jest.fn().mockResolvedValue([{ id: 1 }]);
    const result = await repository.fetchAllCountries();
    expect(result.length).toBeGreaterThan(0);
  });

  it("should fetch states by country id", async () => {
    const query = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
    };
    queryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(query);
    const result = await repository.findStates(1);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should fetch cities by state id", async () => {
    const query = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
    };
    queryRunner.manager.createQueryBuilder = jest.fn().mockReturnValue(query);
    const result = await repository.findCities(1);
    expect(result.length).toBeGreaterThan(0);
  });
});

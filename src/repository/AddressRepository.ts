import {injectable} from 'inversify';
import {database, AddressDTO, AddressSchema, AddressDbSchema} from '../model/AddressSchema';
import {logger} from '../util/Logger';
import {createConnection, Connection, Repository} from 'typeorm';

export interface AddressRepository {
    findAll(): Promise<Array<AddressDTO>>;
    create(addressDTO: AddressDTO): Promise<AddressDTO>;
    update(addressDTO: AddressDTO): Promise<AddressDTO>;
    find(id: string): Promise<AddressDTO>;
}

@injectable()
export class AddressRepositoryImplMongo implements AddressRepository {
    public async findAll(): Promise<Array<AddressDTO>> {
        const addressDTOs = await database.connect().then(() => database.Addresses.find());
        return addressDTOs.toArray();
    }

    public async create(addressDTO: AddressDTO): Promise<AddressDTO> {
        return await database.connect().then(() => database.Addresses.create(addressDTO));
    }

    public async update(addressDTO: AddressDTO): Promise<AddressDTO> {
        const dto: AddressSchema = await database.connect().then(() => database.Addresses.findOne(addressDTO._id));

        dto.address1 = addressDTO.address1;
        if (addressDTO.address2) {
            dto.address2 = addressDTO.address2;
        } else {
            // undefined isn't handled by mongo, so set to null
            dto.address2 = null;
        }
        dto.city = addressDTO.city;
        dto.city = addressDTO.city;
        dto.zip = addressDTO.zip;
        dto.country = addressDTO.country;

        const saved = await dto.save((err: Error, a: AddressDTO) => {
            if (err) {
                logger.error('Error updating address: ' + err);
                // TODO this needs to be handled better.
                throw err;
            }
            return a;
        });

        return saved;
    }

    public async find(id: string): Promise<AddressDTO> {
        return await database.connect().then(() => database.Addresses.findOne(id));
    }
}

@injectable()
export class AddressRepositoryImplDb implements AddressRepository {
    private addressRepository: Repository<AddressDbSchema>;

    constructor() {
        this.connect().then(async connection => {
            this.addressRepository = connection.getRepository(AddressDbSchema);
        });
    }

    public async findAll(): Promise<Array<AddressDTO>> {
        return await this.addressRepository.find();
    }

    public async create(addressDTO: AddressDTO): Promise<AddressDTO> {
        return await this.addressRepository.persist(addressDTO);
    }

    public async update(addressDTO: AddressDTO): Promise<AddressDTO> {
        return await this.addressRepository.persist(addressDTO);
    }

    public async find(id: string): Promise<AddressDTO> {
        return await this.addressRepository.findOneById(id);
    }

    private connect(): Promise<Connection> {
        return createConnection({
            driver: {
                type: 'sqlite',
                storage: 'tmp/sqlitedb.db'
            },
            logging: {
                logQueries: true,
                logSchemaCreation: true
            },
            autoSchemaSync: true,
            entities: [
                AddressDbSchema
            ]
        });
    }
}
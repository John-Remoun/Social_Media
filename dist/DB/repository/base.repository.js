"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options, }) {
        return await this.model.create(data, options);
    }
    async insertMany({ data, }) {
        return (await this.model.create(data));
    }
    async createOne({ data, options, }) {
        return (await this.model.create(data, options));
    }
    async findOne({ filter, projection, options, }) {
        return await this.model.findOne(filter, projection, options).exec();
    }
    async find({ filter, projection, options, }) {
        const doc = this.model.find(filter, projection);
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async findById({ id, projection, options, }) {
        return await this.model.findById(id, projection, options).exec();
    }
    async findMany({ filter, projection, options, }) {
        return await this.model.find(filter, projection, options).exec();
    }
    async updateOne({ filter, update, options, }) {
        return (await this.model
            .findOneAndUpdate(filter, update, { new: true, ...options })
            .exec());
    }
    async updateMany({ filter, update, options, }) {
        return await this.model.updateMany(filter, update, options).exec();
    }
    async deleteOne({ filter, options, }) {
        return await this.model.findOneAndDelete(filter, options).exec();
    }
    async deleteMany({ filter, options, }) {
        return await this.model.deleteMany(filter, options).exec();
    }
}
exports.DatabaseRepository = DatabaseRepository;

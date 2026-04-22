"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const exceptions_1 = require("../common/exceptions");
const services_1 = require("../common/services");
const Enums_1 = require("../common/Enums");
const authentication = (tokenType = Enums_1.tokenTypeEnum.ACCESS) => {
    return async (req, res, next) => {
        const Service = new services_1.tokenService();
        const [key, credential] = req.headers.authorization?.split(" ") || [];
        console.log({ key, credential });
        if (!key || !credential) {
            throw new exceptions_1.UnauthorizedException('Missing authorization');
        }
        switch (key) {
            case 'Basic':
                break;
            default:
                const { decode, user } = await Service.decodeToken({
                    token: credential,
                    tokenType
                });
                req.user = user;
                req.decoded = decode;
                break;
        }
        next();
    };
};
exports.authentication = authentication;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("../middleware/auth");
const __1 = __importDefault(require(".."));
dotenv_1.default.config();
const secret = process.env.SECRET_KEY;
const router = express_1.default.Router();
const signupInput = zod_1.z.object({
    username: zod_1.z.string({
        required_error: "username is required",
        invalid_type_error: "username must be a string"
    }).min(1),
    password: zod_1.z.string({
        required_error: "password is required",
    }).min(4),
    firstname: zod_1.z.string({
        required_error: "firstname is required",
        invalid_type_error: "firstname must not contain numbers"
    }).min(1),
    lastname: zod_1.z.string({
        required_error: "lastname is required",
        invalid_type_error: "lastname must not contain numbers"
    }).min(1)
});
const signinInput = zod_1.z.object({
    username: zod_1.z.string({
        required_error: "username is required",
        invalid_type_error: "username must be a string"
    }).min(1),
    password: zod_1.z.string({
        required_error: "password is required",
    }).min(4)
});
const updateInputType = zod_1.z.object({
    password: zod_1.z.string({
        invalid_type_error: "password must be a string"
    }).min(4).optional(),
    firstname: zod_1.z.string({
        invalid_type_error: "firstname must be a string"
    }).min(1).optional(),
    lastname: zod_1.z.string({
        invalid_type_error: "lastname must be a string"
    }).min(1).optional()
});
const filterInputType = zod_1.z.object({
    firstname: zod_1.z.string({
        invalid_type_error: "firstname must be a string"
    }).optional(),
    lastname: zod_1.z.string({
        invalid_type_error: "lastname must be a string"
    }).optional()
});
router.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsedInput = signupInput.safeParse(req.body);
    if (!parsedInput.success) {
        res.status(422).json({
            error: parsedInput.error
        });
        return;
    }
    const username = parsedInput.data.username;
    const password = yield bcrypt_1.default.hash(req.body.password, 10);
    const firstname = parsedInput.data.firstname;
    const lastname = parsedInput.data.lastname;
    const user = yield __1.default.users.findUnique({
        where: {
            username: username
        }
    });
    if (user) {
        res.json({
            message: "Email already taken / Incorrect inputs"
        });
    }
    else {
        let initialBalance = Math.ceil(Math.random() * 100000);
        yield __1.default.$transaction([
            __1.default.users.create({
                data: {
                    username,
                    password,
                    firstname,
                    lastname
                }
            }),
            __1.default.account.create({
                data: {
                    user: { connect: { username } },
                    balance: initialBalance
                }
            })
        ]);
        res.json({
            message: "User created successfully"
        });
    }
}));
router.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let parsedInput = signinInput.safeParse(req.body);
    if (!parsedInput.success) {
        return res.status(422).json({
            error: parsedInput.error
        });
    }
    let username = parsedInput.data.username;
    let password = parsedInput.data.password;
    let user = yield __1.default.users.findUnique({
        where: {
            username
        }
    });
    if (!user) {
        return res.json({
            error: "username not found"
        });
    }
    else {
        let valid = yield bcrypt_1.default.compare(password, user.password);
        if (!valid) {
            return res.status(403).json({
                message: "invalid password"
            });
        }
        // @ts-ignore
        let token = jsonwebtoken_1.default.sign({ userId: user.id }, secret, { expiresIn: '1h' });
        return res.json({
            message: 'User logged in successfully',
            token
        });
    }
}));
router.put('/', auth_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let parsedInput = updateInputType.safeParse(req.body);
    if (!parsedInput.success) {
        return res.status(411).json({
            error: parsedInput.error
        });
    }
    let userId = req.headers["userId"];
    let update = yield db_1.User.findOneAndUpdate({ _id: userId }, parsedInput.data);
    if (!update) {
        res.status(500).json({
            message: "Error while updating information"
        });
    }
    else {
        res.send({
            message: "Updated successfully"
        });
    }
}));
router.get('/bulk', auth_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let parsedInput = filterInputType.safeParse(req.body);
    if (!parsedInput.success) {
        return res.status(422).send({
            error: parsedInput.error
        });
    }
    let userId = req.headers["userId"];
    let filterData = yield __1.default.users.findMany({
        where: {
            OR: [
                { firstname: parsedInput.data.firstname },
                { lastname: parsedInput.data.lastname }
            ]
        }
    });
    if (!filterData) {
        res.send({
            message: "No users found"
        });
    }
    else {
        console.log(filterData);
        res.send({
            users: filterData
        });
    }
}));
exports.default = router;

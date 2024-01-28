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
const auth_1 = require("../middleware/auth");
const __1 = __importDefault(require(".."));
const zod_1 = require("zod");
const router = express_1.default.Router();
const transferInputType = zod_1.z.object({
    to: zod_1.z.string({
        required_error: "Account number field cant be empty",
        invalid_type_error: "To has to be the account number of recipient's account number"
    }),
    amount: zod_1.z.number({
        invalid_type_error: "Amount has to be a number",
        required_error: "Amount cant be empty"
    })
});
router.get('/balance', auth_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let userId = req.headers["userId"];
    let data = yield __1.default.account.findFirst({
        where: {
            userId: userId
        }
    });
    if (!data) {
        res.json({
            message: "Error fetching balance"
        });
    }
    else {
        res.json({
            balance: data.balance
        });
    }
}));
router.post('/transfer', auth_1.authenticateJWT, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let parsedInput = transferInputType.safeParse(req.body);
    if (!parsedInput.success) {
        return res.status(422).json({
            error: parsedInput.error
        });
    }
    let userId = req.headers["userId"];
    let owner = yield __1.default.account.findFirst({
        where: { userId }
    });
    if (!owner || owner.balance < parsedInput.data.amount) {
        return res.json({
            message: "Insufficient Balance"
        });
    }
    let recipient = yield __1.default.account.findFirst({ where: { userId: parsedInput.data.to } });
    if (!recipient) {
        return res.status(400).json({ message: "Recipient not found. Invalid acoount." });
    }
    let transaction = yield __1.default.$transaction([
        __1.default.account.update({
            where: { userId },
            data: {
                balance: {
                    decrement: parsedInput.data.amount
                }
            }
        }),
        __1.default.account.update({
            where: { userId: recipient.userId },
            data: {
                balance: {
                    increment: parsedInput.data.amount
                }
            }
        })
    ]);
    if (!transaction) {
        res.status(500).send({
            message: "Transaction failed"
        });
    }
    else {
        res.json({
            message: "Transfer successful"
        });
    }
}));
// async function test(){
//     let userId = "65b5058fb91f5d4169e18627";
//     let userId2 = "65b50573b91f5d4169e18625";
//     let amount = 10000
//     let transaction = await prisma.$transaction([
//         prisma.account.update({
//             where: { userId },
//             data: { 
//                 balance: {
//                 decrement: amount
//                 }
//             }
//         }),
//         prisma.account.update({
//             where: { userId: userId2 },
//             data:{
//                 balance: {
//                     increment: amount
//                 }
//             }
//         })
//     ]);
// }
// test();
exports.default = router;

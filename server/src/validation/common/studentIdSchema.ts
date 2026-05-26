import { idField } from "@/utils/idValidation";
import Joi from "joi";

export const studentIdSchema = Joi.object({
    studentId: idField()
});
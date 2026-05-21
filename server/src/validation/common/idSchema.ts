import { idField } from "@/utils/idValidation";
import Joi from "joi";

export const idSchema = Joi.object({
    id: idField()
});
import { idField } from "@/utils/idValidation";
import Joi from "joi";

export const lessonIdSchema = Joi.object({
    lessonId: idField()
});
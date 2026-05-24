import { idField } from "@/utils/idValidation";
import Joi from "joi";

export const groupAndSubjectIdSchema = Joi.object({
    groupId: idField(),
    subjectId: idField()
});
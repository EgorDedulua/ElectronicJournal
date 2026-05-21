import { idField } from '@/utils/idValidation';
import Joi from 'joi';

export const courseSchema = Joi.object({
    teacherId: idField(),
    groupId: idField(),
    subjectId: idField()
});
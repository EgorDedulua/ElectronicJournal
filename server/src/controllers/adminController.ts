import { RegisterDTO } from "@/dto/registerDTO";
import { GroupDTO } from "@/dto/groupDTO";
import { SubjectDTO } from "@/dto/subjectDTO";
import { AdminService } from "@/services/adminService";
import { Request, Response } from "express";
import { UsersQueryDTO } from "@/dto/usersQueryDTO";
import { SubjectsQueryDTO } from "@/dto/subjectsQueryDTO";
import { GroupsQueryDTO } from "@/dto/groupsQueryDTO";

export class AdminController {
    public static async getUsers(req: Request, res: Response) {
        const dto: UsersQueryDTO = req.query;
        const result = await AdminService.getUsers(dto);
        res.status(200).json(result);
    }

    public static async registerUser(req: Request, res: Response) {
        const dto: RegisterDTO = req.body;
        const result = await AdminService.registerUser(dto);
        res.status(201).json(result);
    }

    public static async deleteUser(req: Request, res: Response) {
        const userId = Number(req.params.id);
        await AdminService.deleteUser(userId);
        res.status(204).send();
    }

    public static async updateUser(req: Request, res: Response)  {
        const userId = Number(req.params.id);
        const dto: RegisterDTO = req.body;
        const result = await AdminService.updateUser(userId, dto);
        res.status(200).json(result);
    }

    public static async getSubjects(req: Request, res: Response) {
        const dto: SubjectsQueryDTO = req.query;
        const result = await AdminService.getSubjects(dto);
        res.status(200).json(result);
    }

    public static async addSubject(req: Request, res: Response) {
        const dto: SubjectDTO = req.body;
        const result = await AdminService.addSubject(dto);
        res.status(201).json(result);
    }

    public static async deleteSubject(req: Request, res: Response) {
        const subjectId = Number(req.params.id);
        await AdminService.deleteSubject(subjectId);
        res.status(204).send();
    }

    public static async updateSubject(req: Request, res: Response) {
        const subjectId = Number(req.params.id);
        const dto: SubjectDTO = req.body;
        const result = await AdminService.updateSubject(subjectId, dto);
        res.status(200).json(result);
    }

    public static async getGroups(req: Request, res: Response) {
        const dto: GroupsQueryDTO = req.query;
        const result = await AdminService.getGroups(dto);
        res.status(200).json(result);
    }

    public static async addGroup(req: Request, res: Response) {
        const dto: GroupDTO = req.body;
        const result = await AdminService.addGroup(dto);
        res.status(201).json(result);
    }

    public static async deleteGroup(req: Request, res: Response) {
        const groupId = Number(req.params.id);
        await AdminService.deleteGroup(groupId);
        res.status(204).send();
    }

    public static async updateGroup(req: Request, res: Response) {
        const groupId = Number(req.params.id);
        const dto: GroupDTO = req.body;
        const result = await AdminService.updateGroup(groupId, dto);
        res.status(200).json(result);
    }
}
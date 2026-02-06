import { Router } from 'express'; 
import { getMembers, createMember, getMemberById, deleteMember } from '../controllers/member-controller.js';

const router = Router(); 

router.post('/', createMember);
router.get('/', getMembers);
router.get('/:id', getMemberById);
router.delete('/:id', deleteMember); 

export default router; 

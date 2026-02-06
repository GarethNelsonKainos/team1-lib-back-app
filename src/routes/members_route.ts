import { Router } from 'express'; 
import { getMembers, createMember } from '../controllers/Members.js'; 

const router = Router(); 

router.post('/', createMember);
router.get('/', getMembers); 

export default router; 

import {getUser} from '../DB/querySql.js';
import bycrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; 
import dotenv from 'dotenv';

dotenv.config();

export const loginController =  async (req, res) => {
    const { username, password } = req.body;
    try {
        const user =  await getUser(username);
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('User found:', user.password);
        console.log('Password provided:', password);
        const valid = bycrypt.compareSync(password, user.password);
        if(!valid){
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // crear token JWT
        const token = jwt.sign({ id: user.id_maestro,rol: user.rol, username: user.username }, process.env.JWT_SECRET , { expiresIn: '1h' });
        // eliminar campo password antes de devolver el usuario
        const safeUser = { ...user };
        if (safeUser.password) delete safeUser.password;

        return res.status(200).json({ message: 'Login successful', user: safeUser, token });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
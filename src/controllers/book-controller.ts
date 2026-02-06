import { Request, Response } from 'express';
import * as bookService from '../services/book-service.js';

export const getAllBooks = async (req: Request, res: Response) => {
    console.log("Retrieving all books")
    try {
        const books = await bookService.getAllBooks();
        
        if (books.length > 0) {
            res.status(200).json({
                status: "success",
                message: `Retrieved all books successfully `,
                result: books
            });
        } else {
            res.status(404).json({
                status: "failure",
                message: `No books found`
            });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({
            status: "error",
            message: `Error retrieving books: ${message}`,
            error: message
        });
    }
}
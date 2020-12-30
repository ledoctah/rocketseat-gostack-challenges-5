import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;

  value: number;

  type: 'income' | 'outcome';

  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const categoriesRepository = getRepository(Category);
    let found = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!found) {
      found = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(found);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: found.id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;

import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const found = await transactionRepository.findOne(id);

    if (!found) {
      throw new AppError(
        `Transaction with id ${id} does not exists and cannot be deleted.`,
      );
    }

    transactionRepository.delete(id);
  }
}

export default DeleteTransactionService;

import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const calculate = (type: 'income' | 'outcome'): number => {
      const filtered = transactions.filter(
        transaction => transaction.type === type,
      );

      if (!filtered[0]) return 0;

      return filtered
        .map(transaction => transaction.value)
        .reduce(
          (accumulator, currentValue) =>
            Number(accumulator) + Number(currentValue),
        );
    };

    const income = calculate('income') * 1;
    const outcome = calculate('outcome') * 1;
    const total = income - outcome;

    return {
      income,
      outcome,
      total,
    };
  }
}

export default TransactionsRepository;

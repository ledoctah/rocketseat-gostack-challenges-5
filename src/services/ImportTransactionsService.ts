import { getCustomRepository, getRepository, In } from 'typeorm';
import csvReader from '../lib/csvReader';

import Category from '../models/Category';
import Transaction from '../models/Transaction';

import TransactionsRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';

interface Request {
  filename: string;
}

interface Import {
  title: string;

  type: 'income' | 'outcome';

  value: number;

  category: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const csvData = await csvReader(filename);

    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    // formatting data
    const formattedData: Import[] = csvData.map(row => {
      const [title, type, value, category] = row;

      if (type !== 'income' && type !== 'outcome') {
        throw new AppError(
          'Type needs to be specified as "income" or "outcome"',
        );
      }

      return {
        title,
        type,
        value: Number(value),
        category,
      };
    });

    const balance = await transactionsRepository.getBalance();

    const totalImport = formattedData
      .map(transaction =>
        transaction.type === 'income'
          ? transaction.value
          : transaction.value * -1,
      )
      .reduce((accumulator, currentValue) => accumulator + currentValue);

    if (balance.total + totalImport < 0) {
      throw new AppError('You cannot extrapolate your income totals');
    }

    const categories = formattedData.map(transaction => transaction.category);

    const existentsCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const categoriesToAdd = categories
      .filter(
        category =>
          !existentsCategories.map(cat => cat.title).includes(category),
      )
      .filter((item, index) => categories.indexOf(item) === index)
      .map(category => {
        const categoryToAdd = new Category();
        categoryToAdd.title = category;

        return categoryToAdd;
      });

    categoriesRepository.create(categoriesToAdd);
    categoriesRepository.save(categoriesToAdd);

    existentsCategories.push(...categoriesToAdd);

    const transactions = formattedData.map(transaction => {
      const category = existentsCategories.find(
        cat => cat.title === transaction.category,
      );

      if (!category) throw new AppError('Category cannot be created');

      const transactionToAdd = new Transaction();

      transactionToAdd.title = transaction.title;
      transactionToAdd.type = transaction.type;
      transactionToAdd.value = transaction.value;
      transactionToAdd.category_id = category.id;

      return transactionToAdd;
    });

    transactionsRepository.create(transactions);
    await transactionsRepository.save(transactions);

    return transactions;
  }
}

export default ImportTransactionsService;

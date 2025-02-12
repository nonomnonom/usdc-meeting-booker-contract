import { program } from 'commander';
import { makePayment } from './scripts/make-payment';
import { readPayment } from './scripts/read-payment';
import { checkAllowance } from './scripts/check-allowance';
import { account } from './client';

program
  .command('check-allowance')
  .description('Check USDC allowance')
  .action(async () => {
    await checkAllowance(account.address);
  });

program
  .command('make-payment')
  .description('Make a new USDC payment')
  .action(async () => {
    await makePayment();
  });

program
  .command('read-payment')
  .description('Read a payment by ID')
  .argument('<id>', 'payment ID')
  .action(async (id) => {
    await readPayment(BigInt(id));
  });

program
  .command('withdraw')
  .description('Withdraw USDC (owner only)')
  .action(async () => {
    await import('./scripts/withdraw');
  });

program
  .command('query-payments')
  .description('Query all payments')
  .action(async () => {
    await import('./scripts/query-payments');
  });

program.parse();

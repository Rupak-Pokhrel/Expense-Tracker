import { Selector } from 'testcafe';

fixture `Expense Tracker App`
    .page `http://localhost:3001`;

test('Page loads and shows heading', async t => {
    const heading = Selector('h1');
    await t.expect(heading.exists).ok();
    await t.expect(heading.innerText).eql('Expense Tracker');
});

test('Expenses are loaded from API', async t => {
    const cards = Selector('.expense-card');
    await t.wait(2000);
    await t.expect(cards.count).gte(1);
});

test('Add expense form exists', async t => {
    const form = Selector('form');
    await t.expect(form.exists).ok();
});

test('Can add a new expense', async t => {
    const titleInput = Selector('#title');
    const amountInput = Selector('#amount');
    const categorySelect = Selector('#category');
    const dateInput = Selector('#date');
    const submitBtn = Selector('button[type="submit"]');

    await t
        .typeText(titleInput, 'Test Expense from TestCafe')
        .typeText(amountInput, '25.50')
        .click(categorySelect)
        .click(Selector('option').withText('Food'))
        .typeText(dateInput, '2026-04-01')
        .click(submitBtn);

    await t.wait(2000);
    const cards = Selector('.expense-card');
    await t.expect(cards.count).gte(1);
});

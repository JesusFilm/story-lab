const directory = document.querySelector('.directory');
const search = directory.querySelector('#search');
const buttons = [...directory.querySelectorAll('[data-filter]')];
const rows = [...directory.querySelectorAll('[data-kind]')];
let category = 'All';
function filter() {
  const query = search.value.trim().toLocaleLowerCase();
  let count = 0;
  for (const row of rows) {
    const matches = (category === 'All' || row.dataset.kind === category) && row.textContent.toLocaleLowerCase().includes(query);
    row.hidden = !matches;
    count += Number(matches);
  }
  directory.querySelector('.result-count').textContent = `${count} ${directory.dataset.noun}${count === 1 ? '' : 's'}`;
  directory.querySelector('#empty').hidden = count > 0;
  for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.filter === category));
}
search.addEventListener('input', filter);
for (const button of buttons) button.addEventListener('click', () => { category = button.dataset.filter; filter(); });
directory.querySelector('#clear-filters').addEventListener('click', () => { search.value = ''; category = 'All'; filter(); search.focus(); });

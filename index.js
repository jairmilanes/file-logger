let total = 32;
let page = 15;
let offset = 0;
let remainder = total % page;

for (let i = 1; i <= 3; i++) {
    let diff = (total - (offset + page)) > 0 ? page : remainder;
    console.log(total - (offset + page), diff);
    offset += page;
}

import chalk from 'chalk';

// const alphabet = 'abcdefghijklmnopqrstuvwxyz';
const alphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя abcdefghijklmnopqrstuvwxyz 123456789 =#!@$%^&*()_-';

function randomNumInRange(fromNumber, toNumber) {
    return fromNumber + (toNumber - fromNumber) * Math.random();
}

function diceRoll(chance) {
    return Math.random() < chance
}

function randomLetter() {
    let letter = alphabet[Math.round(randomNumInRange(0, alphabet.length - 1))];

    if (Math.random() > .5) {
        letter = letter.toLocaleUpperCase();
    }

    return letter;
}

function randomLetters(count) {
    let result = [];
    for (let i = 0; i < count; i++) {
        result.push(randomLetter());
    }
    return result.join('');
}

function randomHexColor() {
    return '#' + Math.round(randomNumInRange(0, 16777216 - 1)).toString(16);
}

const targetSequence = 'Клоун с тулбоксом и в маске! Вех!';

const hexCols = [
    '#c5f9d7',
    '#f7d486',
    '#f27a7d'
    // '#e81416',
    // '#ffa500',
    // '#faeb36',
    // '#79c314',
    // '#487de7',
    // '#4b369d',
    // '#70369d'
]

let matchedSequence = '';
let iterationsSpentForNextLetterInSequence = 0;
let guaranteedCorrectGuessOnIterationN = 70;

(async () => {
    while (true) {
        const lettersLeftCount = targetSequence.length - matchedSequence.length;
        if (lettersLeftCount === 0) {
            console.log([...matchedSequence]
                // .map((letter, i) => chalk.hex(hexCols[i % hexCols.length])(letter))
                .join('')
            );

            break;
        }


        const guaranteedCorrectGuessChance = (iterationsSpentForNextLetterInSequence + 1) / guaranteedCorrectGuessOnIterationN;

        let lettersLeftGenerated = diceRoll(guaranteedCorrectGuessChance)
            // guess will be correct 
            ? targetSequence[matchedSequence.length] + randomLetters(lettersLeftCount - 1)
            // otherwise get a random letter
            : randomLetters(lettersLeftCount)
            ;

        iterationsSpentForNextLetterInSequence++;

        console.log(
            [...matchedSequence]
                // .map((letter, i) => chalk.hex(hexCols[i % hexCols.length])(letter))
                .join('')
            + [...lettersLeftGenerated]
                .map(letter => chalk.hex(randomHexColor())(letter))
                .join('')
        );


        const nextLetterInSequence = targetSequence[matchedSequence.length];

        if (lettersLeftGenerated[0] === nextLetterInSequence) {
            matchedSequence += nextLetterInSequence;
            iterationsSpentForNextLetterInSequence = 0;

            continue;
        }

        await new Promise(resolve => setTimeout(resolve, 5));
    }
})();
import preprocessEntities from './preprocesses/entities';

/*
* Apply processing to final outputs from the main processing steps,
* making it all suitable for wiki usage.
*/

export default function () {
    preprocessEntities();
}
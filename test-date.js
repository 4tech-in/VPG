const { formatDistanceToNow } = require('date-fns');

const time = new Date().toISOString();
console.log("Time is:", time);
const date = new Date(time);
console.log("Formatted:", formatDistanceToNow(date, { addSuffix: true }));

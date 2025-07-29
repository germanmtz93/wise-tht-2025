require('dotenv').config();
const axios = require("axios");
const uuid = require("uuid");

const listProfiles = async () => {
    try {
        const url = `https://api.sandbox.transferwise.tech/v2/profiles`;
        const config = {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.WISE_API_TOKEN}`,
            },
        };

        const response = await axios.get(url, config);
        return response.data;
    } catch (error) {
        console.error(`Status ${error.response.status}`);
        console.error(`Trace ID: ${error.response.headers["x-trace-id"]}`);
        console.error(error.response.data);
        throw error;
    }
};

const createQuote = async (profileId) => {
    try {
        const url = `https://api.sandbox.transferwise.tech/v3/profiles/${profileId}/quotes`;
        const config = {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.WISE_API_TOKEN}`,
            },
        };
        const body = {
            sourceCurrency: "SGD",
            targetCurrency: "GBP",
            sourceAmount: 1000,
        };

        const response = await axios.post(url, body, config);
        return response.data;
    } catch (error) {
        console.error(`Status ${error.response.status}`);
        console.error(`Trace ID: ${error.response.headers["x-trace-id"]}`);
        console.error(error.response.data);
        throw error;
    }
};

const createRecipient = async () => {
    try {
        const url = `https://api.sandbox.transferwise.tech/v1/accounts`;
        const config = {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.WISE_API_TOKEN}`,
            },
        };
        const body = {
            accountHolderName: "GBP Person Name",
            currency: "GBP",
            type: "sort_code",
            details: {
                legalType: "PRIVATE",
                sortCode: "04-00-04",
                accountNumber: "12345678",
            },
        };

        const response = await axios.post(url, body, config);
        return response.data;
    } catch (error) {
        console.error(`Status ${error.response.status}`);
        console.error(`Trace ID: ${error.response.headers["x-trace-id"]}`);
        console.error(error.response.data);
        throw error;
    }
};

const formatDeliveryEstimate = (estimatedDelivery) => {
    const deliveryDate = new Date(estimatedDelivery);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    const month = months[deliveryDate.getMonth()];
    const day = deliveryDate.getDate();
    const year = deliveryDate.getFullYear();
    const time = deliveryDate.toTimeString().split(" ")[0]; // Gets HH:MM:SS in 24hr format
    const timezone = deliveryDate.toTimeString().split(" ")[1]; // Gets timezone abbreviation

    return `${month} ${day} ${year} ${time} ${timezone}`;
};

const createTransfer = async (targetAccount, quoteUuid) => {
    try {
        const url = `https://api.sandbox.transferwise.tech/v1/transfers`;
        const config = {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.WISE_API_TOKEN}`,
            },
        };
        const body = {
            targetAccount: targetAccount,
            quoteUuid: quoteUuid,
            customerTransactionId: uuid.v4(),
        };

        const response = await axios.post(url, body, config);
        return response.data;
    } catch (error) {
        console.error(`Status ${error.response.status}`);
        console.error(`Trace ID: ${error.response.headers["x-trace-id"]}`);
        console.error(error.response.data);
        throw error;
    }
};

const runLogic = async () => {
    // Task 1: Find out the Personal Profile ID of the user.
    const profiles = await listProfiles();
    const profileId = profiles[0].id;
    console.log(`1. Profile ID: ${profileId}`); // Example Console Log

    // Create Quote
    const quote = await createQuote(profileId);

    // [IMP] Select BANK_TRANSFER option for both payin and payout
    // Make sure you are selecting the correct payin and payout options to get the correct transfer fee.
    const quoteBankTransfer = quote.paymentOptions.find(
        (option) =>
            option.payIn === "BANK_TRANSFER" &&
            option.payOut === "BANK_TRANSFER",
    );

    // Task 2: Console Log the Quote ID
    console.log(`2. Quote ID: ${quote.id}`);

    // Task 3: Console Log the Amount the recipient will receive, including the currency (e.g. "12.34 GBP")
    console.log(
        `3. Amount the recipient will receive: ${quoteBankTransfer.targetAmount} ${quoteBankTransfer.targetCurrency}`,
    );

    // Task 4: Console Log the Exchange Rate (4 decimal places, e.g. "1.2345")
    const exchangeRate = (
        quoteBankTransfer.sourceAmount / quoteBankTransfer.targetAmount
    ).toFixed(4);
    console.log(`4. Exchange Rate: ${exchangeRate}`);

    // Task 5: Console Log the Fees (total fee)
    console.log(
        `5. Total Fee: ${quoteBankTransfer.fee.total} ${quoteBankTransfer.sourceCurrency}`,
    );

    // Task 6: Console Log the Delivery Estimates (human readable format)
    const estimatedDelivery = quoteBankTransfer.estimatedDelivery;
    const humanReadableDelivery = formatDeliveryEstimate(estimatedDelivery);
    console.log(`6. Delivery Estimates: ${humanReadableDelivery}`);

    // Create Recipient (GBP Sort Code)
    const recipient = await createRecipient();

    // Task 7: Console Log the Recipient ID
    console.log(`7. Recipient ID: ${recipient.id}`);

    // Create Transfer
    const transfer = await createTransfer(recipient.id, quote.id);

    // Task 8: Console Log the Transfer ID
    console.log(`8. Transfer ID: ${transfer.id}`);
    
    // Task 9: Console Log the Transfer Status
    console.log(`9. Transfer Status: ${transfer.status}`);

    // Remember to copy all the console logs to a text file for submission.
    console.log("All tasks completed successfully.");
};

Promise.resolve()
    .then(() => runLogic())
    .catch((error) => {
        console.error("An error occurred:", error.message);
    });

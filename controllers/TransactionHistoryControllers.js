// controllers/transactionController.js
const TransactionModel = require('../models/TransictionHistory');
const express = require('express')

exports.addTransactionDetails = async (amount,type,time) => {
  try {
    console.log(".....>",amount,type,time)
    const newTransaction = new TransactionModel({
      amount,
      type,
      time
    });
    console.log(".....>",newTransaction)
    // Save the transaction to the database
    await newTransaction.save();

  } catch (error) {
   
  }
};



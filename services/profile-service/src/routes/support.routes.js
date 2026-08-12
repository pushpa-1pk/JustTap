const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const SupportTicket = require("../models/SupportTicket");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

// Retrieve curated FAQs
router.get("/faqs", (req, res) => {
  const faqs = [
    {
      id: "faq_1",
      question: "How do I book a service?",
      answer: "Navigate to the Home screen, select a category, pick a service, choose a provider, and click 'Book Service'. Follow the prompts to schedule and pay.",
    },
    {
      id: "faq_2",
      question: "Can I cancel a booking?",
      answer: "Yes, you can cancel your bookings from the Bookings tab. Note that cancellation fees may apply depending on how close it is to the scheduled start time.",
    },
    {
      id: "faq_3",
      question: "How do I update my profile details?",
      answer: "Go to the Profile tab, click on 'Edit Profile' under the header, make your modifications, and click 'Save profile'.",
    },
    {
      id: "faq_4",
      question: "Is my payment information secure?",
      answer: "Absolutely. All payment transactions are securely handled using industry-standard SSL encryption and processed through trusted gateways.",
    },
    {
      id: "faq_5",
      question: "How do I become a service provider?",
      answer: "Click on 'Become a Provider' in your Profile tab, fill out the provider registration details, and submit for admin approval.",
    },
  ];

  return res.status(200).json(new ApiResponse(200, "FAQs retrieved successfully", faqs));
});

// Secure all other support routes with JWT token verification
router.use(verifyToken);

// Create a support ticket
router.post("/tickets", async (req, res, next) => {
  try {
    const { subject, description, category } = req.body;
    if (!subject || !description || !category) {
      throw new ApiError(400, "Subject, description, and category are required.");
    }

    const ticket = await SupportTicket.create({
      userId: req.user.id,
      subject,
      description,
      category,
      messages: [
        {
          sender: "CUSTOMER",
          text: description,
        },
      ],
    });

    return res.status(201).json(new ApiResponse(201, "Support ticket created successfully", ticket));
  } catch (error) {
    next(error);
  }
});

// Get user's support ticket history
router.get("/tickets", async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, "Support tickets retrieved successfully", tickets));
  } catch (error) {
    next(error);
  }
});

module.exports = router;

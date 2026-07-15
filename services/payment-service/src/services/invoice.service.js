const mongoose = require("mongoose");
const invoiceRepository = require("../repositories/invoice.repository");
const outboxRepository = require("../repositories/outbox.repository");
const { runInTransaction } = require("../utils/transaction");

class InvoiceService {
  async initializeInvoiceGeneration(invoiceParams) {
    const { bookingId, type, recipientId, totalAmountPaise, taxAmountPaise, correlationId } = invoiceParams;
    const existingInvoice = await invoiceRepository.findByBookingAndType(bookingId, type);
    if (existingInvoice) {
      return existingInvoice;
    }

    return runInTransaction(async (session) => {
      const sequentialId = await outboxRepository.getNextSequenceAtomic(
        new mongoose.Types.ObjectId(),
        "InvoiceComplianceNumberId",
        session
      );

      const currentYear = new Date().getFullYear();
      const formattedInvoiceNumber = `JT-${currentYear}-${String(sequentialId).padStart(10, "0")}`;

      const invoiceRecord = await invoiceRepository.create({
        bookingId,
        invoiceNumber: formattedInvoiceNumber,
        type,
        invoiceStatus: "GENERATING",
        recipientId,
        totalAmountPaise,
        taxAmountPaise,
        s3Url: null,
        correlationId
      }, session);

      await outboxRepository.queueDomainEvent({
        aggregateType: "Invoice",
        aggregateId: invoiceRecord._id,
        eventType: "invoice.generation.requested",
        payload: {
          invoiceId: invoiceRecord._id,
          invoiceNumber: invoiceRecord.invoiceNumber,
          type
        },
        correlationId
      }, session);

      return invoiceRecord;
    });
  }
}

module.exports = new InvoiceService();

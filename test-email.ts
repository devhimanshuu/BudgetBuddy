import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

// Load env from .env.local
dotenv.config({ path: ".env.local" });

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || "hello@budgetbuddy.app";

if (!SENDGRID_API_KEY) {
	console.error("❌ SENDGRID_API_KEY is not set!");
	process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

async function testEmail() {
	console.log("📧 Testing SendGrid email...");
	console.log(`   From: ${FROM_EMAIL}`);
	console.log(`   API Key: ${SENDGRID_API_KEY?.slice(0, 10)}...`);

	const msg = {
		to: "devhimanshuu@gmail.com", // Change to your email
		from: FROM_EMAIL,
		subject: "Budget Buddy - Test Email ✅",
		html: `<h1 style="color:#f59e0b;">Budget Buddy Test</h1><p>If you're reading this, SendGrid is working! 🎉</p>`,
	};

	try {
		const result = await sgMail.send(msg);
		console.log("✅ Email sent successfully!");
		console.log(`   Status: ${result[0].statusCode}`);
	} catch (error: any) {
		console.error("❌ Failed to send email:");
		if (error.response) {
			console.error(`   Status: ${error.response.statusCode}`);
			console.error(`   Body:`, JSON.stringify(error.response.body, null, 2));
		} else {
			console.error(`   Error:`, error.message);
		}
	}
}

testEmail();

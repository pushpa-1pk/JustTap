const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Category = require("../src/models/category.model");
const Service = require("../src/models/service.model");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/justtap_service_catalog";
const SEED_ADMIN_ID = "admin_seed";

const categoriesToSeed = [
  { name: "Home Services", slug: "home-services", description: "Carpentry, plumbing, electrical, and other home utility help", icon: "home-outline", sortOrder: 1, isActive: true },
  { name: "Beauty & Personal Care", slug: "beauty-personal-care", description: "Haircut, styling, massage, spa, and beauty salon at home", icon: "rose-outline", sortOrder: 2, isActive: true },
  { name: "Automobile Services", slug: "automobile-services", description: "Car and bike washing, servicing, tyre, battery, and towing", icon: "car-outline", sortOrder: 3, isActive: true },
  { name: "IT & Technology", slug: "it-technology", description: "Laptop/mobile repair, virus removal, coding, and web development", icon: "desktop-outline", sortOrder: 4, isActive: true },
  { name: "Education & Training", slug: "education-training", description: "Home tuition, language classes, coaching, and skill development", icon: "book-outline", sortOrder: 5, isActive: true },
  { name: "Health & Wellness", slug: "health-wellness", description: "Yoga, nursing, fitness training, and physiotherapy", icon: "pulse-outline", sortOrder: 6, isActive: true },
  { name: "Business Services", slug: "business-services", description: "Accounting, bookkeeping, tax filing, and digital marketing", icon: "briefcase-outline", sortOrder: 7, isActive: true },
  { name: "Marketing & Creative Services", slug: "marketing-creative-services", description: "Graphic design, video editing, branding, and content writing", icon: "megaphone-outline", sortOrder: 8, isActive: true },
  { name: "Photography & Video", slug: "photography-video", description: "Wedding, product, drone photography, and live streaming", icon: "camera-outline", sortOrder: 9, isActive: true },
  { name: "Events & Entertainment", slug: "events-entertainment", description: "Event planning, decoration, catering, DJ, and stage setup", icon: "sparkles-outline", sortOrder: 10, isActive: true },
  { name: "Moving & Logistics", slug: "moving-logistics", description: "Packers & movers, shifting, courier, and truck rental", icon: "bus-outline", sortOrder: 11, isActive: true },
  { name: "Travel & Transportation", slug: "travel-transportation", description: "Cab booking, airport transfer, hotel booking, and rentals", icon: "airplane-outline", sortOrder: 12, isActive: true },
  { name: "Repair & Maintenance", slug: "repair-maintenance", description: "TV, refrigerator, AC, geyser, and appliance repair", icon: "construct-outline", sortOrder: 13, isActive: true },
  { name: "Construction & Renovation", slug: "construction-renovation", description: "Flooring, tiling, painting, false ceiling, and renovation", icon: "hammer-outline", sortOrder: 14, isActive: true },
  { name: "Commercial Services", slug: "commercial-services", description: "Office cleaning, painting, commercial plumbing, and waste management", icon: "business-outline", sortOrder: 15, isActive: true },
  { name: "Legal & Financial", slug: "legal-financial", description: "Legal consulting, notary, rental agreements, and loans", icon: "document-text-outline", sortOrder: 16, isActive: true },
  { name: "Real Estate", slug: "real-estate", description: "Property buying, selling, rental, and management services", icon: "key-outline", sortOrder: 17, isActive: true },
  { name: "Pet Services", slug: "pet-services", description: "Dog walking, pet grooming, training, sitting, and vet consulting", icon: "paw-outline", sortOrder: 18, isActive: true },
  { name: "Kids & Family Services", slug: "kids-family-services", description: "Babysitting, child care, music, dance, and activity classes", icon: "happy-outline", sortOrder: 19, isActive: true },
  { name: "Senior Care", slug: "senior-care", description: "Elderly care, companion services, doctor visits, and meal preparation", icon: "heart-outline", sortOrder: 20, isActive: true },
  { name: "Agriculture & Gardening", slug: "agriculture-gardening", description: "Lawn maintenance, landscaping, tree cutting, and farm consulting", icon: "leaf-outline", sortOrder: 21, isActive: true },
  { name: "Cleaning & Sanitation", slug: "cleaning-sanitation", description: "Home, bathroom, carpet, sofa, and office cleaning", icon: "brush-outline", sortOrder: 22, isActive: true },
  { name: "Fashion & Tailoring", slug: "fashion-tailoring", description: "Custom tailoring, alterations, stitching, and dry cleaning", icon: "shirt-outline", sortOrder: 23, isActive: true },
  { name: "Food & Catering", slug: "food-catering", description: "Tiffin, catering, home cooks, personal chef, and bakery services", icon: "cafe-outline", sortOrder: 24, isActive: true },
  { name: "Security Services", slug: "security-services", description: "Security guards, CCTV installation, alarms, and access control", icon: "shield-half-outline", sortOrder: 25, isActive: true },
  { name: "Wedding Services", slug: "wedding-services", description: "Planning, videography, decoration, mehendi, and makeup", icon: "ribbon-outline", sortOrder: 26, isActive: true },
  { name: "Freelance & Remote Services", slug: "freelance-remote-services", description: "Data entry, SEO, translation, writing, and digital marketing", icon: "laptop-outline", sortOrder: 27, isActive: true },
  { name: "Professional Services", slug: "professional-services", description: "Resume writing, career counseling, and consulting", icon: "people-circle-outline", sortOrder: 28, isActive: true },
  { name: "Sports & Fitness", slug: "sports-fitness", description: "Gym/personal trainer, yoga, sports coaching, and martial arts", icon: "barbell-outline", sortOrder: 29, isActive: true },
  { name: "Arts & Hobbies", slug: "arts-hobbies", description: "Drawing, painting, craft, guitar, piano, and singing classes", icon: "color-palette-outline", sortOrder: 30, isActive: true },
  { name: "Rental Services", slug: "rental-services", description: "Car, bike, furniture, camera, laptop, and generator rental", icon: "repeat-outline", sortOrder: 31, isActive: true },
  { name: "Retail & Delivery", slug: "retail-delivery", description: "Grocery, medicine, flower, water, and local parcel delivery", icon: "bag-handle-outline", sortOrder: 32, isActive: true },
  { name: "Digital Services", slug: "digital-services", description: "Website design, hosting, e-commerce, and gateway integration", icon: "globe-outline", sortOrder: 33, isActive: true },
  { name: "Personal Assistance", slug: "personal-assistance", description: "Errands, grocery shopping, driver on demand, and queuing assistance", icon: "person-outline", sortOrder: 34, isActive: true },
  { name: "Environmental Services", slug: "environmental-services", description: "Waste collection, recycling, and solar panel cleaning", icon: "refresh-circle-outline", sortOrder: 35, isActive: true },
];

const servicesToSeedRaw = {
  "home-services": [
    "Home Cleaning", "Deep Cleaning", "Bathroom Cleaning", "Kitchen Cleaning", "Sofa Cleaning", 
    "Carpet Cleaning", "Pest Control", "Plumbing", "Electrician", "Carpenter", "Painting", 
    "Waterproofing", "Home Repair", "Appliance Installation", "Water Tank Cleaning", 
    "Chimney Cleaning", "RO/Water Purifier Service", "CCTV Installation", "Home Automation"
  ],
  "beauty-personal-care": [
    "Haircut", "Hair Styling", "Hair Coloring", "Hair Spa", "Facial", "Cleanup", "Manicure", 
    "Pedicure", "Waxing", "Threading", "Makeup", "Bridal Makeup", "Groom Makeup", "Mehendi", 
    "Eyelash Extensions", "Skin Care", "Spa", "Massage", "Salon at Home"
  ],
  "automobile-services": [
    "Car Washing", "Bike Washing", "Car Servicing", "Bike Servicing", "Engine Repair", 
    "AC Repair", "Battery Replacement", "Tyre Replacement", "Wheel Alignment", "Denting", 
    "Painting", "Car Detailing", "Oil Change", "Brake Repair", "Puncture Repair", "Car Towing", 
    "Vehicle Inspection", "Vehicle Pickup & Drop"
  ],
  "it-technology": [
    "Computer Repair", "Laptop Repair", "Mobile Repair", "Printer Repair", "Software Installation", 
    "Windows Installation", "Data Recovery", "Virus Removal", "Wi-Fi Setup", "Network Installation", 
    "CCTV Installation", "Website Development", "App Development", "Software Development", 
    "IT Support", "Cloud Services", "Cybersecurity Services", "Database Services", "Computer Training"
  ],
  "education-training": [
    "Home Tuition", "Online Tuition", "School Coaching", "College Coaching", "Competitive Exam Coaching", 
    "Government Exam Preparation", "Coding Classes", "Computer Classes", "English Speaking", 
    "Language Classes", "Mathematics Classes", "Science Classes", "Music Classes", "Dance Classes", 
    "Drawing Classes", "Personality Development", "Interview Preparation", "Career Counseling", "Skill Development"
  ],
  "health-wellness": [
    "General Consultation", "Nursing at Home", "Physiotherapy", "Yoga", "Fitness Training", 
    "Personal Trainer", "Nutrition Consultation", "Meditation", "Elderly Care", "Patient Care", 
    "Home Health Care", "Medical Equipment Rental", "Lab Sample Collection", "Wellness Programs"
  ],
  "business-services": [
    "Accounting", "Bookkeeping", "GST Services", "Tax Filing", "Business Consulting", "HR Services", 
    "Recruitment", "Payroll Services", "Digital Marketing", "SEO", "Social Media Marketing", 
    "Email Marketing", "Market Research", "Business Registration", "Company Registration", 
    "Data Entry", "Virtual Assistant", "Customer Support"
  ],
  "marketing-creative-services": [
    "Graphic Design", "Logo Design", "Branding", "Video Editing", "Photography", "Content Writing", 
    "Copywriting", "Blog Writing", "Social Media Content", "Product Photography", "Advertisement Design", 
    "Motion Graphics", "Animation", "Voice-over", "Translation", "Printing"
  ],
  "photography-video": [
    "Wedding Photography", "Pre-Wedding Photography", "Event Photography", "Birthday Photography", 
    "Product Photography", "Corporate Photography", "Portrait Photography", "Drone Photography", 
    "Wedding Videography", "Event Videography", "Video Editing", "Live Streaming", "Photo Editing", "Album Design"
  ],
  "events-entertainment": [
    "Event Planning", "Wedding Planning", "Birthday Planning", "Party Planning", "Event Decoration", 
    "Balloon Decoration", "Flower Decoration", "Catering", "DJ", "Live Band", "Anchor/Host", 
    "Dance Performers", "Magic Shows", "Kids Entertainment", "Sound & Lighting", "Stage Setup", "Event Equipment Rental"
  ],
  "moving-logistics": [
    "Packers & Movers", "Local Shifting", "Office Shifting", "Vehicle Transportation", "Furniture Moving", 
    "Loading & Unloading", "Courier Services", "Parcel Delivery", "Same-Day Delivery", "Warehouse Services", 
    "Storage Services", "Mini Truck Rental", "Tempo Rental", "Crane Services"
  ],
  "travel-transportation": [
    "Cab Booking", "Airport Transfer", "Outstation Cab", "Local Taxi", "Bus Booking", "Flight Booking", 
    "Train Booking", "Hotel Booking", "Tour Packages", "Travel Planning", "Tourist Guide", "Car Rental", 
    "Bike Rental", "Driver on Demand", "Travel Insurance Assistance"
  ],
  "repair-maintenance": [
    "Mobile Repair", "Laptop Repair", "TV Repair", "Refrigerator Repair", "Washing Machine Repair", 
    "AC Repair", "Microwave Repair", "Geyser Repair", "Cooler Repair", "Fan Repair", "Inverter Repair", 
    "Battery Repair", "Generator Repair", "Electrical Repair", "Furniture Repair"
  ],
  "construction-renovation": [
    "House Construction", "Civil Work", "Mason Work", "Plastering", "Flooring", "Tiling", 
    "False Ceiling", "Painting", "Waterproofing", "Roofing", "Plumbing", "Electrical Work", 
    "Interior Design", "Kitchen Design", "Bathroom Renovation", "Home Renovation", "Modular Kitchen", "Building Inspection"
  ],
  "commercial-services": [
    "Office Cleaning", "Office Painting", "Office Shifting", "Commercial Plumbing", 
    "Commercial Electrical Work", "AC Maintenance", "CCTV Installation", "Security Services", 
    "Facility Management", "Office Interior Design", "Commercial Pest Control", "Equipment Maintenance", 
    "Commercial Waste Management"
  ],
  "legal-financial": [
    "Legal Consultation", "Document Preparation", "Property Documentation", "Rental Agreement", 
    "Notary Services", "Tax Consultation", "GST Consultation", "Income Tax Filing", "Accounting", 
    "Financial Planning", "Insurance Assistance", "Loan Consultation", "Investment Consultation"
  ],
  "real-estate": [
    "Property Buying", "Property Selling", "Property Rental", "Property Management", 
    "Real Estate Consultation", "Property Valuation", "Home Inspection", "Property Photography", 
    "Rental Agreement", "Commercial Property Services", "Land Services"
  ],
  "pet-services": [
    "Dog Walking", "Pet Grooming", "Pet Bath", "Pet Training", "Pet Sitting", "Pet Boarding", 
    "Pet Transportation", "Pet Photography", "Pet Food Delivery", "Pet Accessories", "Veterinary Consultation"
  ],
  "kids-family-services": [
    "Babysitting", "Nanny Services", "Child Care", "Elderly Care", "Home Tutor", "Kids Activity Classes", 
    "Dance Classes", "Music Classes", "Art Classes", "Sports Coaching", "Birthday Party Services", "Child Transportation"
  ],
  "senior-care": [
    "Elderly Care", "Home Attendant", "Nursing Assistance", "Companion Services", "Medicine Pickup", 
    "Grocery Assistance", "Doctor Appointment Assistance", "Transportation", "Home Cleaning", "Meal Preparation"
  ],
  "agriculture-gardening": [
    "Gardening", "Lawn Maintenance", "Tree Cutting", "Plant Maintenance", "Landscaping", "Garden Design", 
    "Irrigation Installation", "Farm Equipment Rental", "Agricultural Labor", "Pest Control", "Soil Testing", 
    "Farm Consultation", "Nursery Services", "Plant Delivery"
  ],
  "cleaning-sanitation": [
    "Home Cleaning", "Office Cleaning", "Bathroom Cleaning", "Kitchen Cleaning", "Floor Cleaning", 
    "Window Cleaning", "Carpet Cleaning", "Sofa Cleaning", "Water Tank Cleaning", "Waste Removal", 
    "Sanitization", "Commercial Cleaning"
  ],
  "fashion-tailoring": [
    "Tailoring", "Clothes Alteration", "Blouse Stitching", "Suit Stitching", "Dress Stitching", 
    "Embroidery", "Custom Clothing", "Fashion Designing", "Laundry", "Dry Cleaning", "Shoe Cleaning", "Bag Repair"
  ],
  "food-catering": [
    "Home Cook", "Catering", "Tiffin Service", "Meal Delivery", "Party Catering", "Corporate Catering", 
    "Bakery Services", "Cake Making", "Snack Preparation", "Personal Chef", "Food Truck", "Cooking Classes"
  ],
  "security-services": [
    "Security Guard", "Event Security", "Office Security", "Home Security", "CCTV Installation", 
    "CCTV Monitoring", "Alarm Installation", "Access Control", "Security Consultation", "Security System Maintenance"
  ],
  "wedding-services": [
    "Wedding Planning", "Wedding Photography", "Wedding Videography", "Bridal Makeup", "Groom Makeup", 
    "Mehendi", "Wedding Decoration", "Catering", "Wedding Invitation Design", "Wedding Dress", 
    "Jewellery Services", "DJ", "Music Band", "Wedding Venue", "Wedding Transport"
  ],
  "freelance-remote-services": [
    "Data Entry", "Virtual Assistant", "Content Writing", "Translation", "Transcription", 
    "Graphic Design", "Web Development", "App Development", "SEO", "Digital Marketing", 
    "Video Editing", "Online Tutoring", "Customer Support", "Research Services"
  ],
  "professional-services": [
    "Resume Writing", "Interview Coaching", "Career Counseling", "Business Consulting", 
    "Legal Consulting", "Financial Consulting", "HR Consulting", "Technical Consulting", 
    "Project Consulting", "Research Services", "Translation", "Documentation Services"
  ],
  "sports-fitness": [
    "Gym Trainer", "Personal Trainer", "Yoga", "Zumba", "Dance Fitness", "Swimming Coaching", 
    "Cricket Coaching", "Football Coaching", "Badminton Coaching", "Running Coaching", "Martial Arts", 
    "Sports Training", "Fitness Classes"
  ],
  "arts-hobbies": [
    "Drawing Classes", "Painting Classes", "Craft Classes", "Dance Classes", "Singing Classes", 
    "Music Classes", "Guitar Classes", "Piano Classes", "Photography Classes", "Acting Classes", 
    "Art Workshops", "Hobby Classes"
  ],
  "rental-services": [
    "Car Rental", "Bike Rental", "Furniture Rental", "Camera Rental", "Laptop Rental", 
    "Projector Rental", "Sound System Rental", "Event Equipment Rental", "Construction Equipment Rental", 
    "Party Equipment Rental", "Tent Rental", "Generator Rental"
  ],
  "retail-delivery": [
    "Grocery Delivery", "Medicine Delivery", "Flower Delivery", "Gift Delivery", "Food Delivery", 
    "Water Delivery", "Milk Delivery", "Laundry Pickup & Delivery", "Document Delivery", "Local Parcel Delivery"
  ],
  "digital-services": [
    "Website Design", "Website Development", "Domain Registration", "Hosting", "SEO", 
    "Google Business Profile Setup", "Social Media Management", "Online Advertising", "Email Setup", 
    "E-commerce Development", "Payment Gateway Integration", "Website Maintenance"
  ],
  "personal-assistance": [
    "Errand Services", "Grocery Shopping", "Document Pickup", "Courier Pickup", "Appointment Booking", 
    "Queue Assistance", "Home Delivery", "Driver Services", "Personal Assistant", "Senior Assistance"
  ],
  "environmental-services": [
    "Waste Collection", "E-Waste Recycling", "Plastic Recycling", "Paper Recycling", "Scrap Collection", 
    "Composting", "Water Management", "Solar Panel Cleaning", "Solar Panel Maintenance", "Environmental Consulting"
  ]
};

async function seed() {
  console.log("Connecting to MongoDB at:", MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log("Connected successfully!");

  try {
    for (const catData of categoriesToSeed) {
      // Find or create category
      let category = await Category.findOne({ slug: catData.slug });
      
      if (!category) {
        category = await Category.create({
          ...catData,
          createdBy: SEED_ADMIN_ID,
          updatedBy: SEED_ADMIN_ID,
        });
        console.log(`Created Category: ${category.name} (${category._id})`);
      } else {
        // Update category properties
        category.name = catData.name;
        category.description = catData.description;
        category.icon = catData.icon;
        category.sortOrder = catData.sortOrder;
        category.isActive = catData.isActive;
        category.updatedBy = SEED_ADMIN_ID;
        await category.save();
        console.log(`Updated Category: ${category.name} (${category._id})`);
      }

      // Seed services for this category
      const serviceNames = servicesToSeedRaw[catData.slug] || [];
      let srvOrder = 1;
      for (const name of serviceNames) {
        const serviceSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        
        let service = await Service.findOne({
          categoryId: category._id,
          slug: serviceSlug,
        });

        const pricing = {
          type: "BASE_PLUS_VARIABLE",
          basePrice: 299,
          unit: "HOUR",
          additionalUnitPrice: 100
        };

        if (!service) {
          service = await Service.create({
            name,
            slug: serviceSlug,
            description: `Professional ${name} services customized to your needs.`,
            icon: catData.slug === 'home-services' && name === 'Electrician' ? 'flash' : 'construct-outline',
            pricing,
            estimatedDuration: 60,
            isActive: true,
            sortOrder: srvOrder++,
            categoryId: category._id,
            createdBy: SEED_ADMIN_ID,
            updatedBy: SEED_ADMIN_ID,
          });
          console.log(`  └─ Created Service: ${service.name} (${service._id})`);
        } else {
          // Update service details
          service.name = name;
          service.pricing = pricing;
          service.sortOrder = srvOrder++;
          service.isActive = true;
          service.updatedBy = SEED_ADMIN_ID;
          await service.save();
          console.log(`  └─ Updated Service: ${service.name} (${service._id})`);
        }
      }
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seed();

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Category = require("../src/models/category.model");
const Service = require("../src/models/service.model");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/justtap_service_catalog";
const SEED_ADMIN_ID = "admin_seed";

const categoriesToSeed = [
  {
    name: "Home Services",
    slug: "home-services",
    description: "Professional home maintenance services",
    icon: "build-outline",
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "Cleaning",
    slug: "cleaning",
    description: "Professional cleaning services",
    icon: "brush-outline",
    isActive: true,
    sortOrder: 2,
  },
  {
    name: "Beauty & Wellness",
    slug: "beauty-wellness",
    description: "Beauty, massage, and grooming services",
    icon: "rose-outline",
    isActive: true,
    sortOrder: 3,
  },
  {
    name: "Appliance Repair",
    slug: "appliance-repair",
    description: "Home appliance fixing and servicing",
    icon: "construct-outline",
    isActive: true,
    sortOrder: 4,
  },
  {
    name: "Automotive",
    slug: "automotive",
    description: "Vehicles inspection, wash, and minor fixes",
    icon: "car-outline",
    isActive: true,
    sortOrder: 5,
  }
];

const servicesToSeed = {
  "home-services": [
    {
      name: "Electrician",
      slug: "electrician",
      description: "Electrical repair and installation services",
      icon: "flash",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 199, unit: "HOUR", additionalUnitPrice: 100 },
      estimatedDuration: 60,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Plumber",
      slug: "plumber",
      description: "Leak repair, plumbing installation, and water drain cleaning",
      icon: "water",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 249, unit: "HOUR", additionalUnitPrice: 120 },
      estimatedDuration: 60,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: "Carpenter",
      slug: "carpenter",
      description: "Furniture repair, wood setups, and lock alignment",
      icon: "hammer",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 299, unit: "HOUR", additionalUnitPrice: 150 },
      estimatedDuration: 60,
      isActive: true,
      sortOrder: 3,
    },
    {
      name: "Painter",
      slug: "painter",
      description: "Wall painting, touchups, and premium room finishings",
      icon: "color-palette",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 399, unit: "HOUR", additionalUnitPrice: 200 },
      estimatedDuration: 60,
      isActive: true,
      sortOrder: 4,
    },
    {
      name: "AC Repair",
      slug: "ac-repair",
      description: "AC service, cooling check, and gas refill",
      icon: "snow",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 399, unit: "HOUR", additionalUnitPrice: 200 },
      estimatedDuration: 60,
      isActive: true,
      sortOrder: 5,
    }
  ],
  "cleaning": [
    {
      name: "Home Cleaning",
      slug: "home-cleaning",
      description: "Living rooms, kitchen, and deep dusting services",
      icon: "brush",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 499, unit: "HOUR", additionalUnitPrice: 150 },
      estimatedDuration: 120,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Deep Cleaning",
      slug: "deep-cleaning",
      description: "Sanitized high-pressure vacuuming, stain removal, and deep care",
      icon: "sparkles",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 799, unit: "HOUR", additionalUnitPrice: 250 },
      estimatedDuration: 180,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: "Bathroom Cleaning",
      slug: "bathroom-cleaning",
      description: "Tiles descaling, disinfection, and premium scrubbing",
      icon: "water",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 299, unit: "HOUR", additionalUnitPrice: 100 },
      estimatedDuration: 90,
      isActive: true,
      sortOrder: 3,
    }
  ],
  "beauty-wellness": [
    {
      name: "Salon at Home",
      slug: "salon-at-home",
      description: "Men and women haircut, facial massage, and styling",
      icon: "cut",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 599, unit: "HOUR", additionalUnitPrice: 150 },
      estimatedDuration: 60,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Pet Care",
      slug: "pet-care",
      description: "Dog walk, pet bathing, nail trimming, and grooming",
      icon: "paw",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 349, unit: "HOUR", additionalUnitPrice: 100 },
      estimatedDuration: 60,
      isActive: true,
      sortOrder: 2,
    }
  ],
  "appliance-repair": [
    {
      name: "TV Repair",
      slug: "tv-repair",
      description: "LED screen backlight check, wiring, and speaker fixing",
      icon: "tv",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 199, unit: "HOUR", additionalUnitPrice: 100 },
      estimatedDuration: 60,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "RO Service",
      slug: "ro-service",
      description: "Water filter cartridge cleaning, TDS check, and valve repair",
      icon: "beer",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 299, unit: "HOUR", additionalUnitPrice: 100 },
      estimatedDuration: 60,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: "Laptop Repair",
      slug: "laptop-repair",
      description: "Software setup, harddrive backup, screen repair, and RAM expansion",
      icon: "desktop",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 499, unit: "HOUR", additionalUnitPrice: 150 },
      estimatedDuration: 60,
      isActive: true,
      sortOrder: 3,
    }
  ],
  "automotive": [
    {
      name: "Car Wash",
      slug: "car-wash",
      description: "Interior vacuuming and exterior high-pressure foam shampooing",
      icon: "car",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 299, unit: "HOUR", additionalUnitPrice: 100 },
      estimatedDuration: 60,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Bike Repair",
      slug: "bike-repair",
      description: "Engine oil change, chain lubrication, brake checking, and general service",
      icon: "bicycle",
      pricing: { type: "BASE_PLUS_VARIABLE", basePrice: 249, unit: "HOUR", additionalUnitPrice: 100 },
      estimatedDuration: 60,
      isActive: true,
      sortOrder: 2,
    }
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
      const services = servicesToSeed[catData.slug] || [];
      for (const srvData of services) {
        let service = await Service.findOne({
          categoryId: category._id,
          slug: srvData.slug,
        });

        if (!service) {
          service = await Service.create({
            ...srvData,
            categoryId: category._id,
            createdBy: SEED_ADMIN_ID,
            updatedBy: SEED_ADMIN_ID,
          });
          console.log(`  └─ Created Service: ${service.name} (${service._id})`);
        } else {
          // Update service details
          service.name = srvData.name;
          service.description = srvData.description;
          service.icon = srvData.icon;
          service.pricing = srvData.pricing;
          service.estimatedDuration = srvData.estimatedDuration;
          service.sortOrder = srvData.sortOrder;
          service.isActive = srvData.isActive;
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

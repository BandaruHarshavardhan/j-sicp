import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with realistic Indian societal challenges...')

  // Clear existing data (for development only)
  await prisma.progressUpdate.deleteMany()
  await prisma.solutionProposal.deleteMany()
  await prisma.aIAnalysis.deleteMany()
  await prisma.challenge.deleteMany()
  await prisma.user.deleteMany()

  const defaultPassword = await bcrypt.hash('password123', 10)

  // 1. Create Users
  const citizen1 = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      password: defaultPassword,
      role: 'CITIZEN',
      phone: '+91 9876543210'
    }
  })

  const citizen2 = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'priya@example.com',
      password: defaultPassword,
      role: 'CITIZEN',
      phone: '+91 9876543211'
    }
  })

  const institution1 = await prisma.user.create({
    data: {
      name: 'IIT Bombay Innovation Cell',
      email: 'innovation@iitb.ac.in',
      password: defaultPassword,
      role: 'INSTITUTION',
      organization: 'IIT Bombay',
      profileTags: JSON.stringify(["engineering", "research", "technology", "water management", "infrastructure", "hardware"])
    }
  })

  const industry1 = await prisma.user.create({
    data: {
      name: 'Tata Consultancy Services',
      email: 'csr@tcs.com',
      password: defaultPassword,
      role: 'INDUSTRY',
      organization: 'TCS CSR',
      profileTags: JSON.stringify(["IT", "software", "cloud computing", "digital services", "education tech", "funding"])
    }
  })

  const admin1 = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@jsicp.gov.in',
      password: defaultPassword,
      role: 'ADMIN',
      organization: 'J-SICP Admin'
    }
  })

  // 2. Create Challenges
  const c1 = await prisma.challenge.create({
    data: {
      title: 'No proper street lighting near village school',
      description: 'Students and residents face safety risks due to inadequate lighting around the local high school access road in Palghar district, particularly during evening hours.',
      category: 'Infrastructure',
      location: 'Palghar, Maharashtra',
      latitude: 19.6967,
      longitude: 72.7699,
      reporterId: citizen1.id,
      status: 'UNDER_REVIEW'
    }
  })

  await prisma.aIAnalysis.create({
    data: {
      challengeId: c1.id,
      category: 'Infrastructure',
      subcategory: 'Street Lighting',
      severity: 'Medium',
      priority: 'High',
      priorityReason: 'The issue affects a large number of students and directly impacts safety.',
      problemBrief: 'Inadequate street lighting on a school access road is causing significant safety risks for students and local residents during evening and early morning hours.',
      impact: 'Increased risk of accidents and potential security concerns for approximately 500 students and 1200 residents.',
      suggestedStakeholders: JSON.stringify(['Local Panchayat', 'State Electricity Board', 'NGOs focusing on rural development']),
      suggestedSolutions: JSON.stringify(['Installation of solar-powered street lights', 'Community-driven lighting initiative', 'Grid extension by local authorities'])
    }
  })

  const c2 = await prisma.challenge.create({
    data: {
      title: 'Severe drinking water shortage during summers',
      description: 'Our village relies on a single borewell which dries up by April. Women have to walk 4km to fetch water every day.',
      category: 'Water',
      location: 'Beed, Maharashtra',
      latitude: 18.9901,
      longitude: 75.7531,
      reporterId: citizen2.id,
      status: 'ASSIGNED'
    }
  })

  await prisma.aIAnalysis.create({
    data: {
      challengeId: c2.id,
      category: 'Water & Sanitation',
      subcategory: 'Drinking Water Scarcity',
      severity: 'Critical',
      priority: 'Urgent',
      priorityReason: 'Lack of drinking water is a severe health and survival risk affecting thousands.',
      problemBrief: 'Severe seasonal water scarcity forcing residents, primarily women, to walk 4km daily to fetch drinking water.',
      impact: 'Affects daily lives, health, and economic productivity of 2000+ villagers. High risk of dehydration and waterborne diseases from alternative unsafe sources.',
      suggestedStakeholders: JSON.stringify(['Jal Jeevan Mission', 'CSR Foundations', 'Water Resource Department']),
      suggestedSolutions: JSON.stringify(['Rainwater harvesting structures', 'Deepening of existing borewells', 'Construction of a local reservoir', 'Implementation of water atm'])
    }
  })

  // 3. Create Solutions
  const sol1 = await prisma.solutionProposal.create({
    data: {
      challengeId: c2.id,
      organizationId: industry1.id,
      title: 'Solar-Powered Water Filtration & Storage System',
      description: 'We propose to install a 10,000L solar-powered water filtration and storage unit. We will also construct two rainwater harvesting pits to recharge the local aquifer.',
      resources: 'Solar panels, 10kL tank, filtration unit, engineering team of 4',
      estimatedCost: '₹4,50,000',
      timeline: '3 months',
      expectedOutcome: 'Reliable, clean drinking water for the entire village year-round.',
      status: 'ACCEPTED'
    }
  })

  // 4. Create Progress Updates
  await prisma.progressUpdate.create({
    data: {
      solutionId: sol1.id,
      description: 'Site survey completed. Soil testing for rainwater harvesting pits is underway.',
      percentage: 20
    }
  })

  await prisma.progressUpdate.create({
    data: {
      solutionId: sol1.id,
      description: 'Solar panels delivered and installation structure has been erected.',
      percentage: 50
    }
  })

  console.log('Database seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

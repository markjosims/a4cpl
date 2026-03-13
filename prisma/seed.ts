import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@a4cpl.edu" },
    update: {},
    create: {
      email: "admin@a4cpl.edu",
      name: "System Administrator",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Created admin user:", admin.email);

  // Create instructor user (Fire Technology faculty)
  const instructorPassword = await bcrypt.hash("instructor123", 12);
  const instructor = await prisma.user.upsert({
    where: { email: "jhosea@elac.edu" },
    update: {},
    create: {
      email: "jhosea@elac.edu",
      name: "Jason Hosea",
      passwordHash: instructorPassword,
      role: "INSTRUCTOR",
    },
  });
  console.log("Created instructor user:", instructor.email);

  // Create test student user
  const studentPassword = await bcrypt.hash("student123", 12);
  const student = await prisma.user.upsert({
    where: { email: "student@test.edu" },
    update: {},
    create: {
      email: "student@test.edu",
      name: "Test Student",
      passwordHash: studentPassword,
      role: "STUDENT",
      profile: {
        create: {
          experienceType: "CalFire",
          yearsExperience: 5,
          certifications: JSON.stringify(["Firefighter I", "S-130", "S-190"]),
          educationLevel: "High School Diploma",
        },
      },
    },
  });
  console.log("Created student user:", student.email);

  // Create FIRETEK 217 Course
  const course = await prisma.course.upsert({
    where: { code: "FIRETEK 217" },
    update: {},
    create: {
      code: "FIRETEK 217",
      title: "Wildland Fire Control",
      description:
        "This course covers the characteristics, behavior, and management of wildfires. Topics include fire weather, fuels, topography, fire suppression tactics, safety protocols, and incident command systems. Students will learn to assess fire conditions and apply appropriate suppression strategies.",
      department: "Fire Technology",
      instructorId: instructor.id,
      materials: JSON.stringify([
        { type: "textbook", title: "Firefighter's Handbook on Wildland Firefighting" },
        { type: "manual", title: "NWCG Standards for Wildland Fire" },
      ]),
    },
  });
  console.log("Created course:", course.code);

  // Create Learning Outcomes for FIRETEK 217
  const learningOutcomes = [
    {
      code: "LO1",
      title: "Fire Behavior Fundamentals",
      description:
        "Demonstrate understanding of how fire behaves in wildland environments, including the fire triangle, heat transfer methods, and factors affecting fire spread.",
      category: "Knowledge",
      weight: 1.0,
      criteria: JSON.stringify([
        "Explain the fire triangle and its components",
        "Describe heat transfer methods (conduction, convection, radiation)",
        "Identify factors that influence fire spread rate and intensity",
      ]),
    },
    {
      code: "LO2",
      title: "Weather and Fire Relationship",
      description:
        "Analyze how weather conditions affect wildfire behavior and apply this knowledge to predict fire movement.",
      category: "Knowledge",
      weight: 1.0,
      criteria: JSON.stringify([
        "Explain how wind affects fire spread and behavior",
        "Describe the impact of relative humidity on fire intensity",
        "Identify dangerous weather conditions (Red Flag warnings, inversions)",
      ]),
    },
    {
      code: "LO3",
      title: "Fuels Assessment",
      description:
        "Evaluate fuel types, conditions, and their impact on fire behavior to inform suppression strategies.",
      category: "Application",
      weight: 1.2,
      criteria: JSON.stringify([
        "Classify fuel types and their burning characteristics",
        "Assess fuel moisture content and its implications",
        "Identify fuel breaks and their strategic use",
      ]),
    },
    {
      code: "LO4",
      title: "Topography and Fire Spread",
      description:
        "Apply knowledge of terrain features to predict fire behavior and identify tactical considerations.",
      category: "Application",
      weight: 1.0,
      criteria: JSON.stringify([
        "Explain how slope affects fire spread rate",
        "Identify terrain features that influence fire behavior (chimneys, saddles)",
        "Apply topographic analysis to tactical decision-making",
      ]),
    },
    {
      code: "LO5",
      title: "Suppression Tactics and Strategies",
      description:
        "Demonstrate knowledge of wildland fire suppression methods, tactics, and strategic approaches.",
      category: "Skills",
      weight: 1.5,
      criteria: JSON.stringify([
        "Describe direct and indirect attack methods",
        "Explain the use of control lines and their construction",
        "Apply appropriate suppression tactics based on fire conditions",
      ]),
    },
    {
      code: "LO6",
      title: "Safety and LCES",
      description:
        "Apply safety protocols and the LCES (Lookouts, Communications, Escape Routes, Safety Zones) framework.",
      category: "Skills",
      weight: 1.5,
      criteria: JSON.stringify([
        "Explain the LCES safety system and its components",
        "Identify the 18 Watch Out Situations",
        "Apply safety protocols in various fire scenarios",
      ]),
    },
    {
      code: "LO7",
      title: "Tools and Equipment",
      description:
        "Demonstrate knowledge of wildland firefighting tools, equipment, and their proper use.",
      category: "Skills",
      weight: 1.0,
      criteria: JSON.stringify([
        "Identify common hand tools and their applications",
        "Describe proper tool maintenance and safety",
        "Explain the use of specialized equipment (drip torches, pumps)",
      ]),
    },
    {
      code: "LO8",
      title: "Incident Command System",
      description:
        "Understand ICS structure, roles, and communication protocols in wildland fire incidents.",
      category: "Knowledge",
      weight: 1.0,
      criteria: JSON.stringify([
        "Describe ICS organizational structure",
        "Identify key roles and responsibilities",
        "Explain communication protocols and chain of command",
      ]),
    },
  ];

  for (const lo of learningOutcomes) {
    await prisma.learningOutcome.upsert({
      where: { courseId_code: { courseId: course.id, code: lo.code } },
      update: lo,
      create: {
        ...lo,
        courseId: course.id,
      },
    });
  }
  console.log(`Created ${learningOutcomes.length} learning outcomes`);

  // Create CPL Assessment
  const assessment = await prisma.assessment.upsert({
    where: { id: "firetek-217-cpl-assessment" },
    update: {},
    create: {
      id: "firetek-217-cpl-assessment",
      courseId: course.id,
      title: "CPL Assessment - Wildland Fire Control",
      description:
        "This adaptive assessment evaluates your knowledge and skills in wildland fire control. The AI will ask questions based on your experience and adapt to your responses to fairly evaluate your competencies.",
      type: "CPL",
      status: "PUBLISHED",
      timeLimit: null, // No time limit for CPL assessment
      aiModel: "claude-3-sonnet",
      systemPrompt: `You are an expert Fire Technology instructor assessing a candidate for Credit for Prior Learning in Wildland Fire Control (FIRETEK 217). Your role is to:

1. Ask scenario-based questions that allow candidates to demonstrate practical knowledge
2. Adapt your language based on the candidate's background (CalFire, military, CDCR Fire Camp, etc.)
3. Recognize equivalent competencies even when expressed using different terminology
4. Follow up on responses to probe deeper understanding
5. Be encouraging while maintaining rigorous assessment standards
6. Focus on practical application, not just memorization

The candidate may not use formal academic terminology but can demonstrate equivalent knowledge through their experience. Accept valid answers regardless of the specific terms used.

Assessment covers: Fire behavior, weather effects, fuels, topography, suppression tactics, safety (LCES), tools/equipment, and ICS.`,
      publishedAt: new Date(),
    },
  });
  console.log("Created assessment:", assessment.title);

  // Create Rubric for the assessment
  const rubric = await prisma.rubric.upsert({
    where: { assessmentId: assessment.id },
    update: {},
    create: {
      assessmentId: assessment.id,
      title: "FIRETEK 217 CPL Rubric",
      description: "Rubric for evaluating Credit for Prior Learning in Wildland Fire Control",
    },
  });
  console.log("Created rubric:", rubric.title);

  // Get learning outcomes for rubric criteria
  const los = await prisma.learningOutcome.findMany({
    where: { courseId: course.id },
  });

  // Create rubric criteria linked to learning outcomes
  for (const lo of los) {
    await prisma.rubricCriteria.create({
      data: {
        rubricId: rubric.id,
        learningOutcomeId: lo.id,
        title: lo.title,
        description: lo.description,
        maxScore: 100,
        weight: lo.weight,
        levels: JSON.stringify([
          { score: 90, label: "Mastery", description: "Demonstrates comprehensive understanding with practical application" },
          { score: 75, label: "Proficient", description: "Demonstrates solid understanding with minor gaps" },
          { score: 60, label: "Developing", description: "Demonstrates basic understanding, needs further development" },
          { score: 40, label: "Beginning", description: "Demonstrates limited understanding, significant gaps" },
          { score: 0, label: "Not Demonstrated", description: "Unable to demonstrate required knowledge or skills" },
        ]),
      },
    });
  }
  console.log(`Created ${los.length} rubric criteria`);

  console.log("\nSeed completed successfully!");
  console.log("\nTest accounts:");
  console.log("  Admin: admin@a4cpl.edu / admin123");
  console.log("  Instructor: jhosea@elac.edu / instructor123");
  console.log("  Student: student@test.edu / student123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

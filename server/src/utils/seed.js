/**
 * Seeds the database with a working demo dataset.
 *
 * The admin account matters most: public registration hard-blocks the 'admin'
 * role by design, and every /api/admin route requires an existing admin — so
 * without this script there is no way to get the first admin into the system.
 *
 * Run: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../config/db');
const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Connection = require('../models/Connection');
const Post = require('../models/Post');

const PASSWORD = 'Password@123';

const seed = async () => {
    await connectDB();

    console.log('Clearing existing data...');
    await Promise.all([
        User.deleteMany({}),
        Company.deleteMany({}),
        Job.deleteMany({}),
        Application.deleteMany({}),
        Connection.deleteMany({}),
        Post.deleteMany({}),
    ]);

    const hashed = await bcrypt.hash(PASSWORD, 10);

    // ---------- Admin ----------
    const admin = await User.create({
        name: 'Platform Admin',
        email: 'admin@proconnect.test',
        password: hashed,
        role: 'admin',
        isVerified: true,
    });

    // ---------- Recruiters ----------
    const recruiter1 = await User.create({
        name: 'Priya Sharma',
        email: 'priya@nimbus.test',
        password: hashed,
        role: 'recruiter',
        headline: 'Talent Acquisition Lead at Nimbus Labs',
        location: 'Bengaluru, India',
        isVerified: true,
    });

    const recruiter2 = await User.create({
        name: 'Daniel Okoye',
        email: 'daniel@vertex.test',
        password: hashed,
        role: 'recruiter',
        headline: 'Engineering Recruiter at Vertex Systems',
        location: 'Remote',
        isVerified: true,
    });

    // ---------- Companies ----------
    const nimbus = await Company.create({
        name: 'Nimbus Labs',
        description: 'Cloud infrastructure tooling for growing engineering teams.',
        industry: 'Software',
        website: 'https://nimbus.test',
        location: 'Bengaluru, India',
        companySize: '51-200',
        foundedYear: 2018,
        owner: recruiter1._id,
        recruiters: [recruiter1._id],
        verificationStatus: 'verified',
    });

    const vertex = await Company.create({
        name: 'Vertex Systems',
        description: 'Data platforms and analytics for regulated industries.',
        industry: 'Data & Analytics',
        website: 'https://vertex.test',
        location: 'Remote',
        companySize: '201-500',
        foundedYear: 2012,
        owner: recruiter2._id,
        recruiters: [recruiter2._id],
        verificationStatus: 'verified',
    });

    await User.updateOne({ _id: recruiter1._id }, { company: nimbus._id });
    await User.updateOne({ _id: recruiter2._id }, { company: vertex._id });

    // ---------- Job seekers ----------
    const seekerSeeds = [
        {
            name: 'Aarav Mehta',
            email: 'aarav@example.test',
            headline: 'Backend Developer | Node.js, MongoDB',
            location: 'Kolkata, India',
            skills: [
                { name: 'Node.js', proficiency: 'Advanced' },
                { name: 'MongoDB', proficiency: 'Advanced' },
                { name: 'Express', proficiency: 'Advanced' },
            ],
            experience: [
                {
                    company: 'Bitwise Solutions',
                    position: 'Backend Developer',
                    employmentType: 'Full Time',
                    startDate: new Date('2022-01-10'),
                    currentlyWorking: true,
                    description: 'Built REST APIs and background job pipelines.',
                },
            ],
        },
        {
            name: 'Sara Ali',
            email: 'sara@example.test',
            headline: 'Full Stack Engineer | React, Node',
            location: 'Remote',
            skills: [
                { name: 'React', proficiency: 'Expert' },
                { name: 'Node.js', proficiency: 'Intermediate' },
                { name: 'TypeScript', proficiency: 'Advanced' },
            ],
            experience: [
                {
                    company: 'Loop Interactive',
                    position: 'Frontend Engineer',
                    employmentType: 'Full Time',
                    startDate: new Date('2021-06-01'),
                    endDate: new Date('2024-02-01'),
                    description: 'Design system and dashboard work.',
                },
            ],
        },
        {
            name: 'Rohit Nair',
            email: 'rohit@example.test',
            headline: 'Junior Developer seeking opportunities',
            location: 'Pune, India',
            skills: [{ name: 'JavaScript', proficiency: 'Intermediate' }],
            experience: [],
        },
    ];

    const seekers = [];
    for (const s of seekerSeeds) {
        const user = await User.create({
            ...s,
            password: hashed,
            role: 'jobseeker',
            // A resume is required to apply, so give the demo seekers one.
            resume: {
                url: 'https://example.test/resume-placeholder.pdf',
                originalName: 'resume.pdf',
                uploadedAt: new Date(),
            },
        });
        seekers.push(user);
    }

    // ---------- Jobs ----------
    const jobs = await Job.create([
        {
            title: 'Node.js Backend Developer',
            description: 'Build and maintain the API layer powering our cloud tooling platform.',
            responsibilities: ['Design REST APIs', 'Own service reliability', 'Mentor juniors'],
            requirements: ['3+ years with Node.js', 'Strong MongoDB experience'],
            skills: ['Node.js', 'MongoDB', 'Express'],
            experience: { min: 3, max: 6 },
            salary: { min: 1200000, max: 1800000, currency: 'INR', isDisclosed: true },
            location: 'Bengaluru, India',
            workMode: 'Hybrid',
            jobType: 'Full Time',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'active',
            moderationStatus: 'approved',
            company: nimbus._id,
            createdBy: recruiter1._id,
        },
        {
            title: 'Frontend Engineer (React)',
            description: 'Own the customer-facing dashboard and design system implementation.',
            responsibilities: ['Build UI components', 'Improve performance'],
            requirements: ['2+ years with React', 'TypeScript familiarity'],
            skills: ['React', 'TypeScript', 'CSS'],
            experience: { min: 2, max: 5 },
            salary: { min: 1000000, max: 1600000, currency: 'INR', isDisclosed: true },
            location: 'Remote',
            workMode: 'Remote',
            jobType: 'Full Time',
            deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            status: 'active',
            moderationStatus: 'approved',
            company: vertex._id,
            createdBy: recruiter2._id,
        },
        {
            title: 'Data Engineering Intern',
            description: 'Support the data platform team with pipeline development and testing.',
            requirements: ['Final year student or recent graduate'],
            skills: ['Python', 'SQL'],
            experience: { min: 0, max: 1 },
            location: 'Remote',
            workMode: 'Remote',
            jobType: 'Internship',
            deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            status: 'active',
            moderationStatus: 'approved',
            company: vertex._id,
            createdBy: recruiter2._id,
        },
        {
            title: 'Platform SRE (draft)',
            description: 'Reliability engineering for the core platform. Not yet published.',
            skills: ['Kubernetes', 'Terraform'],
            experience: { min: 4, max: 8 },
            location: 'Bengaluru, India',
            workMode: 'On-site',
            jobType: 'Full Time',
            status: 'draft',
            moderationStatus: 'pending',
            company: nimbus._id,
            createdBy: recruiter1._id,
        },
    ]);

    // ---------- Applications ----------
    const app1 = await Application.create({
        job: jobs[0]._id,
        candidate: seekers[0]._id,
        recruiter: recruiter1._id,
        company: nimbus._id,
        resume: { url: seekers[0].resume.url, originalName: 'resume.pdf' },
        coverLetter: 'I have been building Node.js services for three years and would love to contribute.',
        status: 'Under Review',
        statusHistory: [
            { status: 'Applied', changedBy: seekers[0]._id, changedAt: new Date() },
            { status: 'Under Review', changedBy: recruiter1._id, changedAt: new Date() },
        ],
    });

    await Application.create({
        job: jobs[1]._id,
        candidate: seekers[1]._id,
        recruiter: recruiter2._id,
        company: vertex._id,
        resume: { url: seekers[1].resume.url, originalName: 'resume.pdf' },
        status: 'Shortlisted',
        statusHistory: [
            { status: 'Applied', changedBy: seekers[1]._id, changedAt: new Date() },
            { status: 'Shortlisted', changedBy: recruiter2._id, changedAt: new Date() },
        ],
    });

    await Job.updateOne({ _id: jobs[0]._id }, { $inc: { applicationCount: 1 } });
    await Job.updateOne({ _id: jobs[1]._id }, { $inc: { applicationCount: 1 } });

    // ---------- Connections & follows ----------
    await Connection.create({
        requester: seekers[0]._id,
        recipient: seekers[1]._id,
        status: 'accepted',
        respondedAt: new Date(),
    });
    await Connection.create({
        requester: seekers[2]._id,
        recipient: seekers[0]._id,
        status: 'pending',
    });

    await Company.updateOne({ _id: nimbus._id }, { $addToSet: { followers: seekers[0]._id } });
    await Company.updateOne({ _id: vertex._id }, { $addToSet: { followers: { $each: [seekers[0]._id, seekers[1]._id] } } });

    // ---------- Posts ----------
    await Post.create([
        {
            author: seekers[0]._id,
            content: 'Just shipped a rate-limiting layer for our public API. Learned a lot about token buckets.',
        },
        {
            author: recruiter1._id,
            company: nimbus._id,
            content: 'Nimbus Labs is hiring a Node.js Backend Developer. Hybrid, Bengaluru. Apply through our page.',
        },
    ]);

    console.log('\nSeed complete.\n');
    console.log(`All accounts use the password: ${PASSWORD}\n`);
    console.log('  Admin      admin@proconnect.test');
    console.log('  Recruiter  priya@nimbus.test        (Nimbus Labs)');
    console.log('  Recruiter  daniel@vertex.test       (Vertex Systems)');
    console.log('  Jobseeker  aarav@example.test');
    console.log('  Jobseeker  sara@example.test');
    console.log('  Jobseeker  rohit@example.test\n');

    await mongoose.connection.close();
    process.exit(0);
};

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SYLLABUSES = exports.STORAGE_KEYS = void 0;
exports.generateId = generateId;
exports.getStoredData = getStoredData;
exports.setStoredData = setStoredData;
// Storage keys for each module
exports.STORAGE_KEYS = {
    DSA_PROBLEMS: 'placement_dsa_problems',
    SUBJECTS: 'placement_subjects',
    PROJECTS: 'placement_projects',
    APTITUDE_TOPICS: 'placement_aptitude_topics',
    HR_QUESTIONS: 'placement_hr_questions',
    CERTIFICATIONS: 'placement_certifications',
    SYLLABUSES: 'placement_syllabuses',
    CONCEPTS: 'placement_concepts',
    PLACEMENT_COMPANIES: 'placement_companies',
    PLACEMENT_CUSTOM_OPTIONS: 'placement_custom_options',
    AI_CHATS: 'ai_chats',
};
// Default syllabuses for core subjects
exports.DEFAULT_SYLLABUSES = [
    {
        id: 'os',
        name: 'Operating Systems',
        icon: '⚙️',
        description: 'Process management, memory, file systems, and scheduling',
        completionPercentage: 0,
        topics: [
            {
                id: 'os-1',
                name: 'Process & Threads',
                completed: false,
                subtopics: [
                    { id: 'os-1-1', name: 'Process creation and termination', completed: false },
                    { id: 'os-1-2', name: 'Thread management', completed: false },
                    { id: 'os-1-3', name: 'Context switching', completed: false },
                ],
            },
            {
                id: 'os-2',
                name: 'Memory Management',
                completed: false,
                subtopics: [
                    { id: 'os-2-1', name: 'Paging and segmentation', completed: false },
                    { id: 'os-2-2', name: 'Virtual memory', completed: false },
                    { id: 'os-2-3', name: 'Cache management', completed: false },
                ],
            },
            {
                id: 'os-3',
                name: 'Synchronization',
                completed: false,
                subtopics: [
                    { id: 'os-3-1', name: 'Deadlock prevention', completed: false },
                    { id: 'os-3-2', name: 'Semaphores and mutexes', completed: false },
                ],
            },
        ],
    },
    {
        id: 'dbms',
        name: 'Database Management Systems',
        icon: '🗄️',
        description: 'SQL, normalization, transactions, and query optimization',
        completionPercentage: 0,
        topics: [
            {
                id: 'dbms-1',
                name: 'SQL & Queries',
                completed: false,
                subtopics: [
                    { id: 'dbms-1-1', name: 'Basic queries and joins', completed: false },
                    { id: 'dbms-1-2', name: 'Aggregations and subqueries', completed: false },
                    { id: 'dbms-1-3', name: 'Indexes and optimization', completed: false },
                ],
            },
            {
                id: 'dbms-2',
                name: 'Normalization',
                completed: false,
                subtopics: [
                    { id: 'dbms-2-1', name: '1NF to 3NF', completed: false },
                    { id: 'dbms-2-2', name: 'BCNF and 4NF', completed: false },
                ],
            },
            {
                id: 'dbms-3',
                name: 'Transactions & ACID',
                completed: false,
                subtopics: [
                    { id: 'dbms-3-1', name: 'ACID properties', completed: false },
                    { id: 'dbms-3-2', name: 'Concurrency control', completed: false },
                ],
            },
        ],
    },
    {
        id: 'networks',
        name: 'Computer Networks',
        icon: '🌐',
        description: 'OSI model, TCP/IP, routing, and network protocols',
        completionPercentage: 0,
        topics: [
            {
                id: 'net-1',
                name: 'OSI & TCP/IP',
                completed: false,
                subtopics: [
                    { id: 'net-1-1', name: 'OSI model layers', completed: false },
                    { id: 'net-1-2', name: 'TCP/IP stack', completed: false },
                ],
            },
            {
                id: 'net-2',
                name: 'Routing & Switching',
                completed: false,
                subtopics: [
                    { id: 'net-2-1', name: 'IP routing protocols', completed: false },
                    { id: 'net-2-2', name: 'Switching techniques', completed: false },
                ],
            },
            {
                id: 'net-3',
                name: 'Security & Protocols',
                completed: false,
                subtopics: [
                    { id: 'net-3-1', name: 'SSL/TLS and encryption', completed: false },
                    { id: 'net-3-2', name: 'HTTP and DNS', completed: false },
                ],
            },
        ],
    },
    {
        id: 'oop',
        name: 'Object-Oriented Programming',
        icon: '📦',
        description: 'OOP principles, design patterns, and best practices',
        completionPercentage: 0,
        topics: [
            {
                id: 'oop-1',
                name: 'Core Concepts',
                completed: false,
                subtopics: [
                    { id: 'oop-1-1', name: 'Encapsulation and abstraction', completed: false },
                    { id: 'oop-1-2', name: 'Inheritance and polymorphism', completed: false },
                ],
            },
            {
                id: 'oop-2',
                name: 'Design Patterns',
                completed: false,
                subtopics: [
                    { id: 'oop-2-1', name: 'Creational patterns', completed: false },
                    { id: 'oop-2-2', name: 'Structural patterns', completed: false },
                    { id: 'oop-2-3', name: 'Behavioral patterns', completed: false },
                ],
            },
        ],
    },
    {
        id: 'systemdesign',
        name: 'System Design',
        icon: '🏗️',
        description: 'Scalability, distributed systems, and architecture',
        completionPercentage: 0,
        topics: [
            {
                id: 'sd-1',
                name: 'Scalability Concepts',
                completed: false,
                subtopics: [
                    { id: 'sd-1-1', name: 'Load balancing', completed: false },
                    { id: 'sd-1-2', name: 'Caching strategies', completed: false },
                    { id: 'sd-1-3', name: 'Database sharding', completed: false },
                ],
            },
            {
                id: 'sd-2',
                name: 'Distributed Systems',
                completed: false,
                subtopics: [
                    { id: 'sd-2-1', name: 'CAP theorem', completed: false },
                    { id: 'sd-2-2', name: 'Consistency models', completed: false },
                ],
            },
        ],
    },
];
// Helper functions
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function getStoredData(key, defaultValue) {
    if (typeof window === 'undefined')
        return defaultValue;
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    }
    catch {
        return defaultValue;
    }
}
function setStoredData(key, value) {
    if (typeof window === 'undefined')
        return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    }
    catch (error) {
        console.error(`[v0] Error saving data:`, error);
    }
}

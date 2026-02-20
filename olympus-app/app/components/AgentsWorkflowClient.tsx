"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";

interface AgentsWorkflowClientProps {
  user: any;
  projectId: string;
}

export default function AgentsWorkflowClient({
  user,
  projectId,
}: AgentsWorkflowClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading project data
    setLoading(false);
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Agents Workflow
        </h1>
        <p className="text-gray-600">
          Review the work done by our AI agents on your project
        </p>
      </div>

      {/* AI Agents Accordion */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 shadow-sm">
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg font-semibold">
              AI Product Manager
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-gray-700">
                  The AI Product Manager has analyzed your requirements and
                  created a comprehensive product roadmap.
                </p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Key Deliverables:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Product Requirements Document (PRD)</li>
                    <li>User Stories and Acceptance Criteria</li>
                    <li>Feature Prioritization Matrix</li>
                    <li>Project Timeline and Milestones</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg font-semibold">
              AI Architect
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-gray-700">
                  The AI Architect has designed the system architecture and
                  technical specifications for your project.
                </p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Key Deliverables:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>System Architecture Diagram</li>
                    <li>Technology Stack Recommendations</li>
                    <li>Database Schema Design</li>
                    <li>API Design and Documentation</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg font-semibold">
              AI Developer
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-gray-700">
                  The AI Developer has implemented the core functionality and
                  features of your application.
                </p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Key Deliverables:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Source Code Implementation</li>
                    <li>Component Library</li>
                    <li>Integration Tests</li>
                    <li>Code Documentation</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-lg font-semibold">
              AI QA Engineer
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-gray-700">
                  The AI QA Engineer has performed comprehensive testing to
                  ensure quality and reliability.
                </p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Key Deliverables:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Test Plan and Test Cases</li>
                    <li>Automated Test Scripts</li>
                    <li>Bug Reports and Resolution</li>
                    <li>Quality Assurance Report</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-lg font-semibold">
              AI DevOps Engineer
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <p className="text-gray-700">
                  The AI DevOps Engineer has set up the deployment pipeline and
                  infrastructure.
                </p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-semibold mb-2">Key Deliverables:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>CI/CD Pipeline Configuration</li>
                    <li>Infrastructure as Code (IaC)</li>
                    <li>Monitoring and Logging Setup</li>
                    <li>Deployment Documentation</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-3 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition-colors"
        >
          Continue to Deployment
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Book, FileText, HelpCircle, Mail, MessageSquare, Phone, Search, Send, Video } from "lucide-react";

const faqs = [
  {
    question: "How do I add a new truck to the system?",
    answer: "Navigate to the Trucks page and click the 'Add Truck' button in the top right corner. Fill in the required information including vehicle name, plate number, model, and initial status, then click 'Add Truck' to save.",
  },
  {
    question: "How do I assign a driver to a truck?",
    answer: "Go to the Trucks page, select the truck you want to assign, and click on 'Assign Driver' in the driver information section. You can also manage assignments from the Schedule page.",
  },
  {
    question: "How can I track a truck's location?",
    answer: "When a truck is in transit, open the truck details by clicking on it in the Trucks list. You'll see a 'Track Location' button that opens a real-time map showing the truck's current position and route.",
  },
  {
    question: "How do I schedule maintenance for a vehicle?",
    answer: "In the Truck Details view, click the 'Schedule Maintenance' button. Select the maintenance type, date, and any notes. The system will automatically update the truck's status and send reminders.",
  },
  {
    question: "Can I export reports?",
    answer: "Yes! Navigate to the Dashboard and use the export options available for each report section. You can export data as CSV or PDF files for offline analysis.",
  },
  {
    question: "How do I update driver information?",
    answer: "Go to the Drivers page, find the driver you want to update, and click on their name to open the details view. Click the 'Edit' button to modify their information.",
  },
];

const resources = [
  {
    title: "User Guide",
    description: "Complete documentation for using GaLang",
    icon: Book,
  },
  {
    title: "Video Tutorials",
    description: "Step-by-step video guides",
    icon: Video,
  },
  {
    title: "API Documentation",
    description: "Technical documentation for developers",
    icon: FileText,
  },
];

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
  });

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Your message has been sent! We'll get back to you soon.");
    setContactForm({ subject: "", message: "" });
  };

  return (
    <div className="space-y-6 content-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground">Find answers and get assistance with GaLang</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>Quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {filteredFaqs.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No results found. Try a different search term.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Contact Support
              </CardTitle>
              <CardDescription>Can't find what you're looking for? Send us a message.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitContact} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="What do you need help with?"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your issue or question in detail..."
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="gap-2">
                  <Send className="h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Quick Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">support@galang.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">+1 (800) 123-4567</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Support hours: Mon-Fri, 9 AM - 6 PM EST
              </p>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
              <CardDescription>Helpful documentation and guides</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {resources.map((resource) => (
                <Button
                  key={resource.title}
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => toast.info(`Opening ${resource.title}...`)}
                >
                  <resource.icon className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">{resource.title}</div>
                    <div className="text-xs text-muted-foreground">{resource.description}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;

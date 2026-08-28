package com.abhinav.linkedin.user_service.config;

import com.abhinav.linkedin.user_service.entity.Company;
import com.abhinav.linkedin.user_service.entity.EducationalInstitution;
import com.abhinav.linkedin.user_service.entity.Skill;
import com.abhinav.linkedin.user_service.repository.CompanyRepository;
import com.abhinav.linkedin.user_service.repository.EducationalInstitutionRepository;
import com.abhinav.linkedin.user_service.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final CompanyRepository companyRepository;
    private final EducationalInstitutionRepository institutionRepository;
    private final SkillRepository skillRepository;

    @Override
    public void run(String... args) {
        seedCompanies();
        seedInstitutions();
        seedSkills();
    }

    private void seedCompanies() {
        if (companyRepository.count() > 0) {
            return;
        }
        log.info("Seeding normalized companies dataset into database...");

        List<Company> companies = List.of(
            Company.builder().name("Google").domain("google.com").logoUrl("https://logo.clearbit.com/google.com").industry("Technology / Internet").location("Mountain View, CA, USA").build(),
            Company.builder().name("Microsoft").domain("microsoft.com").logoUrl("https://logo.clearbit.com/microsoft.com").industry("Software / Cloud").location("Redmond, WA, USA").build(),
            Company.builder().name("Amazon").domain("amazon.com").logoUrl("https://logo.clearbit.com/amazon.com").industry("E-Commerce / Cloud Computing").location("Seattle, WA, USA").build(),
            Company.builder().name("Apple").domain("apple.com").logoUrl("https://logo.clearbit.com/apple.com").industry("Consumer Electronics / Software").location("Cupertino, CA, USA").build(),
            Company.builder().name("Meta").domain("meta.com").logoUrl("https://logo.clearbit.com/meta.com").industry("Social Media / AI").location("Menlo Park, CA, USA").build(),
            Company.builder().name("Netflix").domain("netflix.com").logoUrl("https://logo.clearbit.com/netflix.com").industry("Streaming / Entertainment").location("Los Gatos, CA, USA").build(),
            Company.builder().name("NVIDIA").domain("nvidia.com").logoUrl("https://logo.clearbit.com/nvidia.com").industry("Semiconductors / AI Computing").location("Santa Clara, CA, USA").build(),
            Company.builder().name("Uber").domain("uber.com").logoUrl("https://logo.clearbit.com/uber.com").industry("Mobility / Technology").location("San Francisco, CA, USA").build(),
            Company.builder().name("Adobe").domain("adobe.com").logoUrl("https://logo.clearbit.com/adobe.com").industry("Creative Software / Cloud").location("San Jose, CA, USA").build(),
            Company.builder().name("Oracle").domain("oracle.com").logoUrl("https://logo.clearbit.com/oracle.com").industry("Enterprise Software / Cloud").location("Austin, TX, USA").build(),
            Company.builder().name("IBM").domain("ibm.com").logoUrl("https://logo.clearbit.com/ibm.com").industry("IT / Enterprise Cloud").location("Armonk, NY, USA").build(),
            Company.builder().name("Salesforce").domain("salesforce.com").logoUrl("https://logo.clearbit.com/salesforce.com").industry("Enterprise SaaS / CRM").location("San Francisco, CA, USA").build(),
            Company.builder().name("Atlassian").domain("atlassian.com").logoUrl("https://logo.clearbit.com/atlassian.com").industry("Collaboration Software").location("Sydney, Australia").build(),
            Company.builder().name("Cisco").domain("cisco.com").logoUrl("https://logo.clearbit.com/cisco.com").industry("Networking / Security").location("San Jose, CA, USA").build(),
            Company.builder().name("Intel").domain("intel.com").logoUrl("https://logo.clearbit.com/intel.com").industry("Semiconductors").location("Santa Clara, CA, USA").build(),
            Company.builder().name("Qualcomm").domain("qualcomm.com").logoUrl("https://logo.clearbit.com/qualcomm.com").industry("Wireless / Semiconductors").location("San Diego, CA, USA").build(),
            Company.builder().name("Stripe").domain("stripe.com").logoUrl("https://logo.clearbit.com/stripe.com").industry("Fintech / Payments").location("South San Francisco, CA, USA").build(),
            Company.builder().name("Spotify").domain("spotify.com").logoUrl("https://logo.clearbit.com/spotify.com").industry("Audio Streaming").location("Stockholm, Sweden").build(),
            Company.builder().name("Airbnb").domain("airbnb.com").logoUrl("https://logo.clearbit.com/airbnb.com").industry("Travel / Hospitality").location("San Francisco, CA, USA").build(),
            Company.builder().name("ByteDance").domain("bytedance.com").logoUrl("https://logo.clearbit.com/bytedance.com").industry("Internet / AI").location("Beijing, China").build(),
            Company.builder().name("Twitter / X").domain("x.com").logoUrl("https://logo.clearbit.com/x.com").industry("Social Media").location("San Francisco, CA, USA").build(),
            Company.builder().name("Snowflake").domain("snowflake.com").logoUrl("https://logo.clearbit.com/snowflake.com").industry("Cloud Data Platform").location("Bozeman, MT, USA").build(),
            Company.builder().name("Databricks").domain("databricks.com").logoUrl("https://logo.clearbit.com/databricks.com").industry("Data & AI Platform").location("San Francisco, CA, USA").build(),
            Company.builder().name("Palo Alto Networks").domain("paloaltonetworks.com").logoUrl("https://logo.clearbit.com/paloaltonetworks.com").industry("Cybersecurity").location("Santa Clara, CA, USA").build(),
            Company.builder().name("ServiceNow").domain("servicenow.com").logoUrl("https://logo.clearbit.com/servicenow.com").industry("Cloud Workflow Software").location("Santa Clara, CA, USA").build(),
            Company.builder().name("PayPal").domain("paypal.com").logoUrl("https://logo.clearbit.com/paypal.com").industry("Fintech / Digital Payments").location("San Jose, CA, USA").build(),
            Company.builder().name("Goldman Sachs").domain("goldmansachs.com").logoUrl("https://logo.clearbit.com/goldmansachs.com").industry("Investment Banking / Fintech").location("New York, NY, USA").build(),
            Company.builder().name("JPMorgan Chase").domain("jpmorganchase.com").logoUrl("https://logo.clearbit.com/jpmorganchase.com").industry("Financial Services / Tech").location("New York, NY, USA").build(),
            Company.builder().name("Morgan Stanley").domain("morganstanley.com").logoUrl("https://logo.clearbit.com/morganstanley.com").industry("Financial Services / Tech").location("New York, NY, USA").build(),
            // Indian Tech Ecosystem
            Company.builder().name("Tata Consultancy Services (TCS)").domain("tcs.com").logoUrl("https://logo.clearbit.com/tcs.com").industry("IT Services / Consulting").location("Mumbai, India").build(),
            Company.builder().name("Infosys").domain("infosys.com").logoUrl("https://logo.clearbit.com/infosys.com").industry("IT Services / Consulting").location("Bengaluru, India").build(),
            Company.builder().name("Wipro").domain("wipro.com").logoUrl("https://logo.clearbit.com/wipro.com").industry("IT Services / Consulting").location("Bengaluru, India").build(),
            Company.builder().name("HCLTech").domain("hcltech.com").logoUrl("https://logo.clearbit.com/hcltech.com").industry("IT Services / Engineering").location("Noida, India").build(),
            Company.builder().name("Tech Mahindra").domain("techmahindra.com").logoUrl("https://logo.clearbit.com/techmahindra.com").industry("IT Services").location("Pune, India").build(),
            Company.builder().name("Accenture").domain("accenture.com").logoUrl("https://logo.clearbit.com/accenture.com").industry("IT Services / Strategy").location("Dublin, Ireland").build(),
            Company.builder().name("Capgemini").domain("capgemini.com").logoUrl("https://logo.clearbit.com/capgemini.com").industry("IT Consulting").location("Paris, France").build(),
            Company.builder().name("Cognizant").domain("cognizant.com").logoUrl("https://logo.clearbit.com/cognizant.com").industry("IT Services").location("Teaneck, NJ, USA").build(),
            Company.builder().name("Flipkart").domain("flipkart.com").logoUrl("https://logo.clearbit.com/flipkart.com").industry("E-Commerce").location("Bengaluru, India").build(),
            Company.builder().name("Swiggy").domain("swiggy.com").logoUrl("https://logo.clearbit.com/swiggy.com").industry("On-Demand Delivery / Tech").location("Bengaluru, India").build(),
            Company.builder().name("Zomato").domain("zomato.com").logoUrl("https://logo.clearbit.com/zomato.com").industry("Food Delivery / Quick Commerce").location("Gurugram, India").build(),
            Company.builder().name("Razorpay").domain("razorpay.com").logoUrl("https://logo.clearbit.com/razorpay.com").industry("Fintech / Payments").location("Bengaluru, India").build(),
            Company.builder().name("CRED").domain("cred.club").logoUrl("https://logo.clearbit.com/cred.club").industry("Fintech / Rewards").location("Bengaluru, India").build(),
            Company.builder().name("PhonePe").domain("phonepe.com").logoUrl("https://logo.clearbit.com/phonepe.com").industry("Fintech / UPI Payments").location("Bengaluru, India").build(),
            Company.builder().name("Paytm").domain("paytm.com").logoUrl("https://logo.clearbit.com/paytm.com").industry("Fintech / Payments").location("Noida, India").build(),
            Company.builder().name("Ola").domain("olacabs.com").logoUrl("https://logo.clearbit.com/olacabs.com").industry("Mobility / Electric Vehicles").location("Bengaluru, India").build(),
            Company.builder().name("Zepto").domain("zeptonow.com").logoUrl("https://logo.clearbit.com/zeptonow.com").industry("Quick Commerce").location("Mumbai, India").build(),
            Company.builder().name("Blinkit").domain("blinkit.com").logoUrl("https://logo.clearbit.com/blinkit.com").industry("Quick Commerce").location("Gurugram, India").build(),
            Company.builder().name("Groww").domain("groww.in").logoUrl("https://logo.clearbit.com/groww.in").industry("Investment / Fintech").location("Bengaluru, India").build(),
            Company.builder().name("Zerodha").domain("zerodha.com").logoUrl("https://logo.clearbit.com/zerodha.com").industry("Stock Broking / Fintech").location("Bengaluru, India").build(),
            Company.builder().name("InMobi").domain("inmobi.com").logoUrl("https://logo.clearbit.com/inmobi.com").industry("AdTech / AI").location("Bengaluru, India").build(),
            Company.builder().name("Postman").domain("postman.com").logoUrl("https://logo.clearbit.com/postman.com").industry("API Platform").location("San Francisco, CA / Bengaluru").build(),
            Company.builder().name("BrowserStack").domain("browserstack.com").logoUrl("https://logo.clearbit.com/browserstack.com").industry("Software Testing / Cloud").location("Dublin, Ireland / Mumbai").build()
        );

        companyRepository.saveAll(companies);
        log.info("Successfully seeded {} companies.", companies.size());
    }

    private void seedInstitutions() {
        if (institutionRepository.count() > 0) {
            return;
        }
        log.info("Seeding recognized educational institutions dataset into database...");

        List<EducationalInstitution> institutions = List.of(
            // IITs
            EducationalInstitution.builder().name("Indian Institute of Technology Delhi (IIT Delhi)").shortName("IIT Delhi").location("New Delhi, India").build(),
            EducationalInstitution.builder().name("Indian Institute of Technology Bombay (IIT Bombay)").shortName("IIT Bombay").location("Mumbai, Maharashtra, India").build(),
            EducationalInstitution.builder().name("Indian Institute of Technology Madras (IIT Madras)").shortName("IIT Madras").location("Chennai, Tamil Nadu, India").build(),
            EducationalInstitution.builder().name("Indian Institute of Technology Kanpur (IIT Kanpur)").shortName("IIT Kanpur").location("Kanpur, Uttar Pradesh, India").build(),
            EducationalInstitution.builder().name("Indian Institute of Technology Kharagpur (IIT Kharagpur)").shortName("IIT KGP").location("Kharagpur, West Bengal, India").build(),
            EducationalInstitution.builder().name("Indian Institute of Technology Roorkee (IIT Roorkee)").shortName("IIT Roorkee").location("Roorkee, Uttarakhand, India").build(),
            EducationalInstitution.builder().name("Indian Institute of Technology Guwahati (IIT Guwahati)").shortName("IIT Guwahati").location("Guwahati, Assam, India").build(),
            EducationalInstitution.builder().name("Indian Institute of Technology Hyderabad (IIT Hyderabad)").shortName("IIT Hyderabad").location("Kandi, Telangana, India").build(),
            EducationalInstitution.builder().name("Indian Institute of Technology BHU (IIT Varanasi)").shortName("IIT BHU").location("Varanasi, Uttar Pradesh, India").build(),
            EducationalInstitution.builder().name("Indian Institute of Technology ISM Dhanbad").shortName("IIT Dhanbad").location("Dhanbad, Jharkhand, India").build(),
            EducationalInstitution.builder().name("Indian Institute of Technology Indore").shortName("IIT Indore").location("Indore, Madhya Pradesh, India").build(),
            EducationalInstitution.builder().name("Indian Institute of Technology Gandhinagar").shortName("IIT Gandhinagar").location("Gandhinagar, Gujarat, India").build(),
            // Premier Indian Universities & Institutes
            EducationalInstitution.builder().name("Indian Institute of Science (IISc Bangalore)").shortName("IISc Bangalore").location("Bengaluru, Karnataka, India").build(),
            EducationalInstitution.builder().name("Birla Institute of Technology and Science, Pilani (BITS Pilani)").shortName("BITS Pilani").location("Pilani, Rajasthan, India").build(),
            EducationalInstitution.builder().name("University of Delhi (Delhi University)").shortName("Delhi University (DU)").location("New Delhi, India").build(),
            EducationalInstitution.builder().name("International Institute of Information Technology, Hyderabad (IIIT Hyderabad)").shortName("IIIT Hyderabad").location("Hyderabad, Telangana, India").build(),
            EducationalInstitution.builder().name("International Institute of Information Technology, Bangalore (IIIT Bangalore)").shortName("IIIT Bangalore").location("Bengaluru, Karnataka, India").build(),
            EducationalInstitution.builder().name("Delhi Technological University (DTU)").shortName("DTU").location("New Delhi, India").build(),
            EducationalInstitution.builder().name("Netaji Subhas University of Technology (NSUT)").shortName("NSUT").location("New Delhi, India").build(),
            EducationalInstitution.builder().name("National Institute of Technology Tiruchirappalli (NIT Trichy)").shortName("NIT Trichy").location("Tiruchirappalli, Tamil Nadu, India").build(),
            EducationalInstitution.builder().name("National Institute of Technology Karnataka, Surathkal (NIT Surathkal)").shortName("NIT Surathkal").location("Surathkal, Karnataka, India").build(),
            EducationalInstitution.builder().name("National Institute of Technology Warangal (NIT Warangal)").shortName("NIT Warangal").location("Warangal, Telangana, India").build(),
            EducationalInstitution.builder().name("National Institute of Technology Calicut (NIT Calicut)").shortName("NIT Calicut").location("Calicut, Kerala, India").build(),
            EducationalInstitution.builder().name("National Institute of Technology Rourkela (NIT Rourkela)").shortName("NIT Rourkela").location("Rourkela, Odisha, India").build(),
            EducationalInstitution.builder().name("Jadavpur University").shortName("Jadavpur University").location("Kolkata, West Bengal, India").build(),
            EducationalInstitution.builder().name("Anna University").shortName("Anna University").location("Chennai, Tamil Nadu, India").build(),
            EducationalInstitution.builder().name("Vellore Institute of Technology (VIT)").shortName("VIT").location("Vellore, Tamil Nadu, India").build(),
            EducationalInstitution.builder().name("Manipal Institute of Technology (MIT Manipal)").shortName("Manipal").location("Manipal, Karnataka, India").build(),
            EducationalInstitution.builder().name("Thapar Institute of Engineering and Technology").shortName("Thapar").location("Patiala, Punjab, India").build(),
            EducationalInstitution.builder().name("Indian Institute of Management Ahmedabad (IIM Ahmedabad)").shortName("IIM-A").location("Ahmedabad, Gujarat, India").build(),
            EducationalInstitution.builder().name("Indian Institute of Management Bangalore (IIM Bangalore)").shortName("IIM-B").location("Bengaluru, Karnataka, India").build(),
            EducationalInstitution.builder().name("Indian Institute of Management Calcutta (IIM Calcutta)").shortName("IIM-C").location("Kolkata, West Bengal, India").build(),
            // Top Global Universities
            EducationalInstitution.builder().name("Stanford University").shortName("Stanford").location("Stanford, CA, USA").build(),
            EducationalInstitution.builder().name("Massachusetts Institute of Technology (MIT)").shortName("MIT").location("Cambridge, MA, USA").build(),
            EducationalInstitution.builder().name("Harvard University").shortName("Harvard").location("Cambridge, MA, USA").build(),
            EducationalInstitution.builder().name("University of California, Berkeley (UC Berkeley)").shortName("UC Berkeley").location("Berkeley, CA, USA").build(),
            EducationalInstitution.builder().name("Carnegie Mellon University (CMU)").shortName("CMU").location("Pittsburgh, PA, USA").build(),
            EducationalInstitution.builder().name("University of Cambridge").shortName("Cambridge").location("Cambridge, UK").build(),
            EducationalInstitution.builder().name("University of Oxford").shortName("Oxford").location("Oxford, UK").build(),
            EducationalInstitution.builder().name("Imperial College London").shortName("Imperial").location("London, UK").build(),
            EducationalInstitution.builder().name("National University of Singapore (NUS)").shortName("NUS").location("Singapore").build(),
            EducationalInstitution.builder().name("Nanyang Technological University (NTU)").shortName("NTU").location("Singapore").build(),
            EducationalInstitution.builder().name("ETH Zurich").shortName("ETH Zurich").location("Zurich, Switzerland").build(),
            EducationalInstitution.builder().name("University of Washington").shortName("UW").location("Seattle, WA, USA").build(),
            EducationalInstitution.builder().name("University of Toronto").shortName("U of T").location("Toronto, ON, Canada").build(),
            EducationalInstitution.builder().name("University of Waterloo").shortName("Waterloo").location("Waterloo, ON, Canada").build(),
            EducationalInstitution.builder().name("Georgia Institute of Technology (Georgia Tech)").shortName("Georgia Tech").location("Atlanta, GA, USA").build(),
            EducationalInstitution.builder().name("University of Illinois Urbana-Champaign (UIUC)").shortName("UIUC").location("Urbana, IL, USA").build(),
            EducationalInstitution.builder().name("University of Michigan, Ann Arbor").shortName("UMich").location("Ann Arbor, MI, USA").build(),
            EducationalInstitution.builder().name("Columbia University").shortName("Columbia").location("New York, NY, USA").build()
        );

        institutionRepository.saveAll(institutions);
        log.info("Successfully seeded {} educational institutions.", institutions.size());
    }

    private void seedSkills() {
        if (skillRepository.count() > 0) {
            return;
        }
        log.info("Seeding normalized technical skills dataset into database...");

        List<Skill> skills = List.of(
            // Backend & Languages
            Skill.builder().name("Java 21").normalizedName("java 21").category("Backend").build(),
            Skill.builder().name("Java").normalizedName("java").category("Backend").build(),
            Skill.builder().name("Spring Boot").normalizedName("spring boot").category("Backend").build(),
            Skill.builder().name("Spring Cloud").normalizedName("spring cloud").category("Backend").build(),
            Skill.builder().name("Microservices").normalizedName("microservices").category("Architecture").build(),
            Skill.builder().name("Distributed Systems").normalizedName("distributed systems").category("Architecture").build(),
            Skill.builder().name("System Design").normalizedName("system design").category("Architecture").build(),
            Skill.builder().name("Apache Kafka").normalizedName("apache kafka").category("Messaging").build(),
            Skill.builder().name("RabbitMQ").normalizedName("rabbitmq").category("Messaging").build(),
            Skill.builder().name("RESTful APIs").normalizedName("restful apis").category("Backend").build(),
            Skill.builder().name("gRPC").normalizedName("grpc").category("Backend").build(),
            Skill.builder().name("GraphQL").normalizedName("graphql").category("Backend").build(),
            Skill.builder().name("WebSockets & STOMP").normalizedName("websockets & stomp").category("Backend").build(),
            Skill.builder().name("Python").normalizedName("python").category("Backend").build(),
            Skill.builder().name("FastAPI").normalizedName("fastapi").category("Backend").build(),
            Skill.builder().name("Django").normalizedName("django").category("Backend").build(),
            Skill.builder().name("Go (Golang)").normalizedName("go (golang)").category("Backend").build(),
            Skill.builder().name("Node.js").normalizedName("node.js").category("Backend").build(),
            Skill.builder().name("Express.js").normalizedName("express.js").category("Backend").build(),
            Skill.builder().name("C++").normalizedName("c++").category("Backend").build(),
            Skill.builder().name("Rust").normalizedName("rust").category("Backend").build(),
            // Frontend
            Skill.builder().name("React").normalizedName("react").category("Frontend").build(),
            Skill.builder().name("TypeScript").normalizedName("typescript").category("Frontend").build(),
            Skill.builder().name("JavaScript").normalizedName("javascript").category("Frontend").build(),
            Skill.builder().name("Next.js").normalizedName("next.js").category("Frontend").build(),
            Skill.builder().name("Vue.js").normalizedName("vue.js").category("Frontend").build(),
            Skill.builder().name("Tailwind CSS").normalizedName("tailwind css").category("Frontend").build(),
            Skill.builder().name("Redux Toolkit").normalizedName("redux toolkit").category("Frontend").build(),
            Skill.builder().name("React Query (TanStack)").normalizedName("react query (tanstack)").category("Frontend").build(),
            Skill.builder().name("HTML5 & CSS3").normalizedName("html5 & css3").category("Frontend").build(),
            Skill.builder().name("Vite").normalizedName("vite").category("Frontend").build(),
            // Databases & Storage
            Skill.builder().name("PostgreSQL").normalizedName("postgresql").category("Database").build(),
            Skill.builder().name("MySQL").normalizedName("mysql").category("Database").build(),
            Skill.builder().name("Redis").normalizedName("redis").category("Database").build(),
            Skill.builder().name("MongoDB").normalizedName("mongodb").category("Database").build(),
            Skill.builder().name("Neo4j (Graph DB)").normalizedName("neo4j (graph db)").category("Database").build(),
            Skill.builder().name("Elasticsearch").normalizedName("elasticsearch").category("Database").build(),
            Skill.builder().name("Cassandra").normalizedName("cassandra").category("Database").build(),
            Skill.builder().name("Database Indexing & Query Tuning").normalizedName("database indexing & query tuning").category("Database").build(),
            // Cloud & DevOps
            Skill.builder().name("Amazon Web Services (AWS)").normalizedName("amazon web services (aws)").category("Cloud & DevOps").build(),
            Skill.builder().name("AWS S3 & CloudFront CDN").normalizedName("aws s3 & cloudfront cdn").category("Cloud & DevOps").build(),
            Skill.builder().name("AWS EC2").normalizedName("aws ec2").category("Cloud & DevOps").build(),
            Skill.builder().name("Google Cloud Platform (GCP)").normalizedName("google cloud platform (gcp)").category("Cloud & DevOps").build(),
            Skill.builder().name("Microsoft Azure").normalizedName("microsoft azure").category("Cloud & DevOps").build(),
            Skill.builder().name("Docker").normalizedName("docker").category("Cloud & DevOps").build(),
            Skill.builder().name("Kubernetes (K8s)").normalizedName("kubernetes (k8s)").category("Cloud & DevOps").build(),
            Skill.builder().name("Terraform").normalizedName("terraform").category("Cloud & DevOps").build(),
            Skill.builder().name("CI/CD (GitHub Actions)").normalizedName("ci/cd (github actions)").category("Cloud & DevOps").build(),
            Skill.builder().name("Linux Server Administration").normalizedName("linux server administration").category("Cloud & DevOps").build(),
            Skill.builder().name("Nginx Reverse Proxy").normalizedName("nginx reverse proxy").category("Cloud & DevOps").build(),
            // Observability & Security
            Skill.builder().name("Zipkin Distributed Tracing").normalizedName("zipkin distributed tracing").category("Observability").build(),
            Skill.builder().name("Prometheus & Grafana").normalizedName("prometheus & grafana").category("Observability").build(),
            Skill.builder().name("OAuth2 & JWT Security").normalizedName("oauth2 & jwt security").category("Security").build(),
            Skill.builder().name("Unit Testing (JUnit 5 / Mockito)").normalizedName("unit testing (junit 5 / mockito)").category("Testing").build(),
            Skill.builder().name("High Concurrency & Load Testing (k6)").normalizedName("high concurrency & load testing (k6)").category("Testing").build()
        );

        skillRepository.saveAll(skills);
        log.info("Successfully seeded {} technical skills.", skills.size());
    }
}

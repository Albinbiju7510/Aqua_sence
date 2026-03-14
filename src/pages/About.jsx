import { Github, Linkedin, Mail, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import teamLeadImg from '../assets/team_lead.jpg';
import aromalImg from '../assets/team/aromal.jpg';
import anselImg from '../assets/team/ansel.jpg';
import christoImg from '../assets/team/christo.jpg';

export default function About() {
    return (
        <div className="min-h-screen relative overflow-hidden py-12 px-4">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="max-w-3xl mx-auto text-center mb-20 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-6 text-cyan-400 text-sm font-medium">
                        <Droplets size={16} /> Final Year Project
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-cyan-400 to-blue-500 mb-6">
                        Building Sustainable Water Infrastructure
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        AquaSense is a comprehensive IoT solution designed to monitor, analyze, and optimize water usage in real-time. By leveraging advanced sensors and cloud analytics, we aim to reduce waste and prevent infrastructure failures.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 text-center">
                    <TeamMember name="Albin Biju" role="Team Lead" image={teamLeadImg} delay={0.1} />
                    <TeamMember name="Aromal M" role="Team Member" image={aromalImg} delay={0.2} />
                    <TeamMember name="Christo Mathew George" role="Team Member" image={christoImg} delay={0.3} />
                    <TeamMember name="Ansel A jiji" role="Team Member" image={anselImg} delay={0.4} />
                </div>

                <div className="glass-card p-10 text-center max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-4">Academic Context</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        This project was developed as a Final Year Engineering Project to demonstrate the practical application of Internet of Things (IoT) and Cloud Computing in Utility Management.
                    </p>
                </div>
            </div>
        </div>
    );
}

function TeamMember({ name, role, image, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="glass-card p-8 border hover:border-cyan-500/30 transition-all duration-300 group text-center"
        >
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-cyan-500/20 to-blue-600/20 p-1 mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-cyan-400 font-bold text-3xl overflow-hidden">
                    {image ? (
                        <img src={image} alt={name} className="w-full h-full object-cover" />
                    ) : (
                        name.charAt(0)
                    )}
                </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{name}</h3>
            <p className="text-sm font-medium text-slate-400 mb-5">{role}</p>

            <div className="flex justify-center gap-4">
                <SocialButton icon={Github} />
                <SocialButton icon={Linkedin} />
                <SocialButton icon={Mail} />
            </div>
        </motion.div>
    );
}

function SocialButton({ icon: Icon }) {
    return (
        <button className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-500 transition-all">
            <Icon size={16} />
        </button>
    )
}

import type { StudentSkill } from '../lib/api';

export default function SkillsetPanel({ skills }: { skills: StudentSkill[] }) {
  if (!skills || skills.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-text font-bold text-lg">Your skillset</h3>
        <span className="text-text-muted">^</span>
      </div>
      
      <div className="space-y-5">
        {skills.map((skill) => {
          // Calculate progress to next level
          const levels = [0, 100, 250, 500];
          const currentLevelXP = levels[skill.level_index];
          const nextLevelXP = levels[skill.level_index + 1] || levels[skill.level_index];
          
          let progress = 100;
          if (nextLevelXP > currentLevelXP) {
             progress = ((skill.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
          }

          return (
            <div key={skill.id} className="relative">
              <div className="flex justify-between items-end mb-2">
                <div className="font-bold text-text">{skill.track_name}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-border px-2 py-0.5 rounded text-text-muted">
                    Level {skill.level_index}
                  </span>
                  <span className="text-xs font-mono text-text-muted">
                    {skill.level_index}/{levels.length - 1}
                  </span>
                </div>
              </div>
              
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%`, backgroundColor: skill.track_color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

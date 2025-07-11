
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SectionData } from "@/types/portfolio";

export const useSectionData = (userId: string | undefined) => {
  const [sections, setSections] = useState<SectionData[]>([]);

  const fetchSections = async () => {
    if (!userId) return [];
    
    try {
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select(`
          id,
          title,
          projects:projects(
            id,
            title,
            description,
            links:links(
              id,
              title,
              url
            ),
            features:features(
              id,
              title
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (sectionsError) {
        console.error("Error fetching sections:", sectionsError);
        throw sectionsError;
      }
      
      if (sectionsData && sectionsData.length > 0) {
        // Transform data to match the expected structure
        const transformedSections: SectionData[] = sectionsData.map(section => ({
          id: section.id,
          title: section.title,
          projects: section.projects.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description || "",
            links: project.links.map(link => ({
              id: link.id,
              title: link.title,
              url: link.url
            })),
            features: project.features.map(feature => ({
              id: feature.id,
              title: feature.title
            }))
          }))
        }));
        
        setSections(transformedSections);
        return transformedSections;
      }
      
      return [];
    } catch (error: any) {
      console.error("Error in fetchSections:", error);
      return [];
    }
  };

  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    if (sections.length <= 1) return;
    
    // Find the current index of the section
    const currentIndex = sections.findIndex(section => section.id === sectionId);
    if (currentIndex === -1) return;
    
    // Calculate the new index based on direction
    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1) 
      : Math.min(sections.length - 1, currentIndex + 1);
    
    // If the section is already at the top/bottom, do nothing
    if (newIndex === currentIndex) return;
    
    // Create a new array with the updated order
    const newSections = [...sections];
    const [movedSection] = newSections.splice(currentIndex, 1);
    newSections.splice(newIndex, 0, movedSection);
    
    // Update state immediately for responsive UI
    setSections(newSections);
    
    try {
      // For now we're just reordering in memory
      // In a future implementation, we could add a position column to the sections table
      // and update it for affected sections in the database
      console.log(`Section ${sectionId} moved ${direction} from index ${currentIndex} to ${newIndex}`);
      return true;
    } catch (error) {
      console.error("Error moving section:", error);
      // Revert the state change on error
      setSections(sections);
      return false;
    }
  };

  return {
    sections,
    setSections,
    fetchSections,
    moveSection
  };
};

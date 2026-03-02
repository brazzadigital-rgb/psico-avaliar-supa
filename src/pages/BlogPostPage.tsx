import { useQuery } from "@tanstack/react-query";
import { Link, useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Share2, BookOpen, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { useEffect, useState } from "react";
import blogPsicoterapia from "@/assets/blog/psicoterapia-hero.jpg";
import blogAba from "@/assets/blog/terapia-aba-criancas.jpg";
import blogMindfulness from "@/assets/blog/ansiedade-meditacao.jpg";
import blogFamilia from "@/assets/blog/familia-apoio.jpg";

// Map local images to slugs
const blogImageMap: Record<string, string> = {
  "beneficios-psicoterapia-saude-mental": blogPsicoterapia,
  "terapia-aba-beneficios-criancas-autismo": blogAba,
  "5-tecnicas-mindfulness-controlar-ansiedade": blogMindfulness,
  "importancia-apoio-familiar-saude-mental": blogFamilia,
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  category: { name: string; slug: string } | null;
}

// Calculate reading time
const calculateReadingTime = (content: string | null): number => {
  if (!content) return 1;
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

export default function BlogPostPage() {
  const { slug } = useParams();
  const { getWhatsAppUrl } = useWhatsApp();
  const [readProgress, setReadProgress] = useState(0);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, category:blog_categories(name, slug)")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug,
  });

  const { data: relatedPosts } = useQuery({
    queryKey: ["related-posts", post?.category?.slug],
    queryFn: async () => {
      if (!post?.category) return [];
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, published_at")
        .eq("status", "published")
        .neq("id", post.id)
        .limit(3);
      return data || [];
    },
    enabled: !!post,
  });

  // Reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setReadProgress(Math.min(100, progress));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getPostImage = (postSlug: string, coverUrl: string | null) => {
    if (blogImageMap[postSlug]) return blogImageMap[postSlug];
    if (coverUrl && !coverUrl.startsWith("/src/")) return coverUrl;
    return null;
  };

  const postImage = post ? getPostImage(post.slug, post.cover_image_url) : null;
  const readingTime = post ? calculateReadingTime(post.content) : 1;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt || "",
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container-wide py-20 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <Layout>
      {/* Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-primary to-accent z-[60] transition-all duration-150"
        style={{ width: `${readProgress}%` }}
      />

      <article>
        {/* Compact Header */}
        <header className="pt-6 pb-4 md:pt-10 md:pb-6">
          <div className="container-wide">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Blog
                </Link>
                {post.category && (
                  <Link to={`/blog/categoria/${post.category.slug}`}>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">{post.category.name}</Badge>
                  </Link>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold mb-3 leading-tight">{post.title}</h1>

              <div className="flex flex-wrap items-center gap-3 text-[11px] md:text-xs text-muted-foreground">
                {post.published_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(post.published_at), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {readingTime} min de leitura
                </span>
                <button 
                  onClick={handleShare} 
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Share2 className="w-3 h-3" /> Compartilhar
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {postImage && (
          <div className="container-wide mb-6 md:mb-8">
            <div className="max-w-2xl mx-auto">
              <img
                src={postImage}
                alt={post.title}
                className="w-full aspect-[2/1] object-cover rounded-xl shadow-md"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="pb-10 md:pb-14">
          <div className="container-wide">
            <div className="max-w-2xl mx-auto">
              {/* Excerpt highlight */}
              {post.excerpt && (
                <div className="mb-6 p-4 rounded-xl bg-primary/5 border-l-4 border-primary">
                  <p className="text-sm md:text-[15px] text-foreground/80 italic leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              )}

              {/* Article content */}
              {post.content ? (
                <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.content }} />
              ) : (
                <p className="text-muted-foreground text-sm">Conteúdo não disponível.</p>
              )}

              {/* CTA */}
              <div className="mt-8 p-4 md:p-5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm md:text-base font-display font-bold mb-1">
                      Precisa de ajuda especializada?
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Nossa equipe está pronta para atender você.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild className="btn-premium text-white h-8 text-xs px-4">
                      <Link to="/agendar">Agendar</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-8 text-xs px-4">
                      <a
                        href={getWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Posts - Larger Cards */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="py-10 md:py-14 bg-secondary/30">
            <div className="container-wide">
              <div className="flex items-center justify-between mb-6 max-w-4xl mx-auto">
                <h2 className="text-lg md:text-xl font-display font-bold">
                  Continue lendo
                </h2>
                <Link 
                  to="/blog"
                  className="text-xs md:text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
                >
                  Ver todos <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              
              <div className="grid md:grid-cols-3 gap-5 md:gap-6 max-w-4xl mx-auto">
                {relatedPosts.map((related: any) => {
                  const relatedImage = getPostImage(related.slug, related.cover_image_url);
                  return (
                    <Link
                      key={related.id}
                      to={`/blog/${related.slug}`}
                      className="group bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-500"
                    >
                      {relatedImage ? (
                        <div className="aspect-[16/10] overflow-hidden">
                          <img
                            src={relatedImage}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/10] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-primary/30" />
                        </div>
                      )}
                      <div className="p-4 md:p-5">
                        <h3 className="text-sm md:text-base font-display font-bold group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
                          {related.title}
                        </h3>
                        {related.excerpt && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {related.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          {related.published_at && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(related.published_at), "dd MMM", { locale: ptBR })}
                            </span>
                          )}
                          <span className="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                            Ler <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </article>
    </Layout>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import blogPsicoterapia from "@/assets/blog/psicoterapia-hero.jpg";
import blogAba from "@/assets/blog/terapia-aba-criancas.jpg";
import blogMindfulness from "@/assets/blog/ansiedade-meditacao.jpg";
import blogFamilia from "@/assets/blog/familia-apoio.jpg";
import heroImage from "@/assets/hero-blog.jpg";

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
  cover_image_url: string | null;
  published_at: string | null;
  category: { name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function BlogListPage() {
  const { categorySlug } = useParams();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts", categorySlug],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, published_at, category:blog_categories(name, slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (categorySlug) {
        const { data: category } = await supabase
          .from("blog_categories")
          .select("id")
          .eq("slug", categorySlug)
          .single();
        
        if (category) {
          query = query.eq("category_id", category.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const currentCategory = categories?.find((c) => c.slug === categorySlug);

  // Filter out "Avaliações" category to hide it
  const visibleCategories = categories?.filter((c) => c.slug !== "avaliacoes");

  const getPostImage = (post: BlogPost) => {
    if (blogImageMap[post.slug]) return blogImageMap[post.slug];
    if (post.cover_image_url && !post.cover_image_url.startsWith("/src/")) return post.cover_image_url;
    return null;
  };

  return (
    <Layout>
      {/* Hero - Compact Premium */}
      <section 
        className="relative py-16 md:py-20 overflow-hidden"
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        
        <div className="container-wide relative z-10">
          <div className="max-w-2xl mx-auto text-center md:text-left md:mx-0">
            <Badge className="mb-3">Blog</Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-3">
              {currentCategory ? currentCategory.name : "Blog Psicoavaliar"}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              {currentCategory?.description ||
                "Artigos sobre saúde mental, desenvolvimento infantil e bem-estar."}
            </p>
          </div>
        </div>
      </section>

      {/* Categories - Hide on issues */}
      {visibleCategories && visibleCategories.length > 0 && (
        <section className="py-6 border-b">
          <div className="container-wide">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Link to="/blog">
                <Badge
                  variant={!categorySlug ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 text-xs md:text-sm"
                >
                  Todos
                </Badge>
              </Link>
              {visibleCategories.map((cat) => (
                <Link key={cat.id} to={`/blog/categoria/${cat.slug}`}>
                  <Badge
                    variant={categorySlug === cat.slug ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10 text-xs md:text-sm"
                  >
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Posts Grid - Premium Cards */}
      <section className="py-12 md:py-16">
        <div className="container-wide">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : posts?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum artigo encontrado.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {posts?.map((post) => {
                const imageUrl = getPostImage(post);
                return (
                  <article
                    key={post.id}
                    className="group bg-card rounded-2xl md:rounded-3xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-500"
                  >
                    <Link to={`/blog/${post.slug}`} className="block">
                      {imageUrl ? (
                        <div className="aspect-[16/9] overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <BookOpen className="w-10 h-10 text-primary/30" />
                        </div>
                      )}
                    </Link>
                    <div className="p-4 md:p-6">
                      {post.category && (
                        <Link to={`/blog/categoria/${post.category.slug}`}>
                          <Badge variant="secondary" className="mb-2 text-xs hover:bg-primary hover:text-primary-foreground transition-colors">
                            {post.category.name}
                          </Badge>
                        </Link>
                      )}
                      <h2 className="font-display font-bold text-base md:text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </h2>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-3">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t">
                        {post.published_at && (
                          <span className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(post.published_at), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        )}
                        <Link
                          to={`/blog/${post.slug}`}
                          className="flex items-center gap-1 text-xs md:text-sm font-medium text-primary hover:gap-2 transition-all"
                        >
                          Ler <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

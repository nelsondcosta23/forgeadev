import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export const CRM = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Customer Relationship Management</CardTitle>
          </div>
          <CardDescription>
            Gestão detalhada das empresas parceiras do Selling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em desenvolvimento - Esta secção irá conter informação detalhada sobre as empresas que trabalham connosco.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

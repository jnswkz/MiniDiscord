import java.sql.*;
public class TestDB {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres";
        String user = "postgres.wjczkrkbcqgkjpvupupb";
        String pass = "nhincaidjtmemay123";
        try {
            Class.forName("org.postgresql.Driver");
            Connection c = DriverManager.getConnection(url, user, pass);
            System.out.println("CONNECTED: " + c.getMetaData().getDatabaseProductVersion());
            c.close();
        } catch (Exception e) {
            System.out.println("FAILED: " + e.getMessage());
        }
    }
}
